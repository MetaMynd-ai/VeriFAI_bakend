<?php
class Scicom_Emgs_Model_Cron_SmartApp
{
    private $_ids;

    /**
     * Get IDs.
     *
     * @return array
     */
    public function getIds()
    {
        return $this->_ids;
    }

    /**
     * Set IDs.
     *
     * @param array $ids
     * @return $this
     */
    public function setIds($ids)
    {
        $this->_ids = $ids;
        return $this;
    }

    /**
     * Get attribute params.
     *
     * @return array
     */
    protected function _getAttributeParams()
    {
        $attribute = Mage::getModel('extendedcustomer/attribute')->loadByAttributeCode('wallet_id');
        return [$attribute->getBackendTable(), $attribute->getEntityTypeId(), $attribute->getAttributeId()];
    }

    /**
     * Get test mode IO adapter.
     *
     * @param string $jobCode
     * @return Varien_Io_File|null
     */
    protected function _getTestModeIoAdapter($jobCode)
    {
        if (Mage::getStoreConfigFlag('jim_api/smart_app/test_mode')) {
            $dt = Mage::getSingleton('core/date')->date('Ymd-His');
            $file = Mage::getBaseDir('var') . DS . 'log' . DS . "$jobCode-$dt.log";
            $io = new Varien_Io_File();
            $io->setAllowCreateFolders(true);
            $io->open(['path' => dirname($file)]);
            $io->streamOpen($file, 'w+');
            return $io;
        }
        return null;
    }

    /**
     * Create wallets by student IDs.
     * About 3.2 sec to create one wallet.
     *
     * @param Mage_Cron_Model_Schedule|array|null $schedule
     * @return array|void
     */
    public function wallet($schedule = null)
    {
        if ($schedule instanceof Mage_Cron_Model_Schedule && !Mage::getStoreConfigFlag('jim_api/smart_app/enabled')) {
            $schedule->setMessages('Cron disabled');
            return;
        }

        [$backendTable, $entityTypeId, $attributeId] = $this->_getAttributeParams();

        $installer = Mage::getResourceModel('core/setup', 'emgs_setup');
        $db = $installer->getConnection();
        if ($this->getIds()) {
            $ids = $this->getIds();
        } else {
            $select = $db->select()
                ->from(['o' => $installer->getTable('sales/order_grid')], ['applicant_id'])
                ->joinLeft(
                    ['a' => $backendTable],
                    "o.applicant_id = a.entity_id AND a.attribute_id = $attributeId",
                    []
                )
                ->where('o.applicant_id IS NOT NULL')
                ->where('a.value IS NULL') // wallet_id does not exist.
                ->where('o.type LIKE ?', 'im14%')
                ->where('o.invoice_created_at >= ?', date('Y-m-d', strtotime('-1 year')))
                ->group('o.applicant_id')
            ;
            if (Mage::getStoreConfigFlag('jim_api/smart_app/test_mode')) {
                $lastId = (int) Mage::getModel('core/flag', ['flag_code' => 'smartapp_wallet_last_id'])
                    ->loadSelf()
                    ->getFlagData();
                if ($lastId) {
                    $select->where('o.applicant_id > ?', $lastId);
                }
            }
            if ($limit = (int)Mage::getStoreConfig('jim_api/smart_app/cron_limit_wallet')) {
                $select->limit($limit);
            }
            $ids = $db->fetchCol($select);
        }
        $total = count($ids);

        /** @var Varien_Io_File $io */
        $io = $schedule['io'] ?? $this->_getTestModeIoAdapter($schedule ? $schedule->getJobCode() . $schedule->getId() : 'smartapp_wallet');
        $helper = Mage::helper('emgs/webService_smartAppSession');
        $cnt = 0;
        $upto = strtotime('+55 mins');
        $errors = [];
        [$user, $role] = Mage::helper('base')->getSessionUser();
        /** @var string $id int student ID. */
        foreach ($ids as $id) {
            try {
                $response = $helper->call('POST', 'wallets', ['userId' => $id]);
                $result = json_decode($response->getBody()->getContents(), true)['account'] ?? [];
            } catch (GuzzleHttp\Exception\RequestException $e) {
                $result = json_decode($e->getResponse()->getBody()->getContents(), true);
                $errors[$id][] = $result;
                $message = $result['message'] ?? '';
                if (strpos($message, 'already exists') !== false) {
                    try {
                        $response = $helper->call('GET', "wallets/$id");
                        $result = json_decode($response->getBody()->getContents(), true);
                    } catch (GuzzleHttp\Exception\RequestException $e) {
                        $errors[$id][] = json_decode($e->getResponse()->getBody()->getContents(), true);
                    }
                }
            } catch (GuzzleHttp\Exception\BadResponseException $e) {
                $errors[$id][] = $e->getMessage();
                break;
            }
            if ($io) {
                $io->streamWrite(json_encode([$id => $result]) . PHP_EOL);
                if (isset($result['id'])) {
                    $cnt++;
                    // Save last ID to flag only if it is a cron job, avoid saving when called from createIkadVc().
                    if ($schedule instanceof Mage_Cron_Model_Schedule && Mage::getStoreConfigFlag('jim_api/smart_app/test_mode')) {
                        Mage::getModel('core/flag', ['flag_code' => 'smartapp_wallet_last_id'])
                            ->loadSelf()
                            ->setFlagData($id)
                            ->save();
                    }
                }
            } else
            if ($walletId = $result['id'] ?? 0) {
                $db->insert($backendTable, ['entity_type_id' => $entityTypeId, 'attribute_id' => $attributeId, 'entity_id' => $id, 'value' => $walletId]);
                $cnt++;
                Mage::getModel('logger/event')->setData([
                    'acted_at' => Varien_Date::now(),
                    'username' => $user,
                    'userrole' => $role,
                    'remote_addr' => Mage::helper('core/http')->getRemoteAddr(true),
                    'prefix' => 'customer',
                    'object_id' => $id,
                    'action' => 'updated',
                    'action_data' => [['field' => 'wallet_id', 'from' => '', 'to' => $walletId]],
                ])->save();
            }
            if (time() > $upto) {
                break;
            }
        }

        if ($schedule instanceof Mage_Cron_Model_Schedule) {
            if ($io) {
                if ($errors) {
                    $io->streamWrite('ERRORS:' . PHP_EOL);
                    $io->streamWrite(json_encode($errors));
                } else {
                    $io->streamWrite('NO ERROR');
                }
                $io->streamClose();
            }
            $schedule->setMessages("$cnt/$total");
            if ($errors) {
                return $errors;
            }
        } else {
            return [
                'cnt' => $cnt,
                'errors' => $errors,
                'ids' => $ids,
            ];
        }
    }

    /**
     * Create Ikad VC.
     * About 16 sec to create one VC.
     *
     * @param Mage_Cron_Model_Schedule|null $schedule
     * @return array|void
     */
    public function createIkadVc($schedule = null)
    {
        if ($schedule instanceof Mage_Cron_Model_Schedule && !Mage::getStoreConfigFlag('jim_api/smart_app/enabled')) {
            $schedule->setMessages('Cron disabled');
            return;
        }

        $io = $this->_getTestModeIoAdapter($schedule ? $schedule->getJobCode() . $schedule->getId() : 'smartapp_ikad_vc');
        [$backendTable, $entityTypeId, $attributeId] = $this->_getAttributeParams();
        $resource = Mage::getResourceSingleton('mohe/student_history');
        $rows = $resource->getActiveiKadForVerifiableCredential(
            $backendTable, $attributeId, (int)Mage::getStoreConfig('jim_api/smart_app/cron_limit_vc_ikad')
        );
        $total = count($rows);
        $helper = Mage::helper('emgs/webService_smartAppSession');
        $cnt = 0;
        $upto = strtotime('+55 mins');
        $errors = [];
        $bodies = [];
        $response = null;
        $helperString = Mage::helper('base/string');
        foreach ($rows as $row) {
            $ikad = Mage::getModel('mohe/ikad')->load($row['ikad_id']);
            $userId = $ikad->getStudentId();
            if (!$row['wallet_id']) {
                if ($io) {
                    $io->streamWrite($userId . ' create wallet: ');
                }
                $this->setIds([$userId]);
                $result = $this->wallet(['io' => $io]);
                if ($result['cnt'] === 0) {
                    $errors[$userId][] = $userId . ' wallet not created';
                    if ($io) {
                        $io->streamWrite($result['errors'][$userId][0] ?? 'error' . PHP_EOL);
                    }
                    continue;
                }
            }
            $data = $ikad->getApiFields();
            unset($data['status']);
            // $ikad->getIkadExpiredOn() looks like 2025-05-20
            // Convert to unix timestamp in milliseconds.
            $milliseconds = strtotime("{$ikad->getIkadExpiredOn()} -8 hours") * 1000;
            $response = null;
            try {
                $response = $helper->call('POST', "identities/credentials/ikad/$userId", [
                    'base64metadata' => base64_encode(json_encode($data)),
                    'expiration_date' => (string) $milliseconds
                ]);
            } catch (GuzzleHttp\Exception\RequestException $e) {
                $result = json_decode($e->getResponse()->getBody()->getContents(), true);
                $errors[$userId][] = $result;
                $message = $result['message'] ?? '';
                if (strpos($message, 'User already has an active credential with issuer ikad') !== false) {
                    try {
                        $response = $helper->call('GET', "identities/credentials/ikad/$userId");
                    } catch (GuzzleHttp\Exception\RequestException $e) {
                        $errors[$userId][] = json_decode($e->getResponse()->getBody()->getContents(), true);
                    }
                } elseif (strpos($message, 'User does not have an identity yet') !== false) {
                    try {
                        // Supposed to be implemented in SmartApp on the fly.
                        $helper->call('POST', "identities/$userId");
                        /* Skip because the following response does not has status code 200 and body.
                        $response = $helper->call('POST', "identities/credentials/ikad/$userId", [
                            'base64metadata' => base64_encode(json_encode($ikad->getApiFields())),
                            'expiration_date' => $ikad->getIkadExpiredOn() //2025-05-20
                        ]);
                        Mage::helper('clog')->log('vc response', $response);
                        */
                    } catch (GuzzleHttp\Exception\RequestException $e) {
                        $errors[$userId][] = json_decode($e->getResponse()->getBody()->getContents(), true);
                    }
                }
            } catch (GuzzleHttp\Exception\BadResponseException $e) {
                $errors[$userId][] = $e->getMessage();
                break;
            }

            $body = $response ? $response->getBody()->getContents() : '';
            if ($io) {
                $io->streamWrite("h#{$row['history_id']} u#$userId: $body" . PHP_EOL);
                if ($response && in_array($response->getStatusCode(), [200, 201])) {
                    $cnt++;
                    if (Mage::getStoreConfigFlag('jim_api/smart_app/test_mode')) {
                        $did = strlen($body) > 255
                            ? json_encode([
                                '_id' => $helperString->between($body, '"_id":"', '"'),
                                'status' => $helperString->between($body, '"status":"', '"'),
                            ])
                            : $body;
                        // Update did with test prefix in mohe_ikad_status_history.
                        $resource->update(['did' => "t:$did"], ['entity_id = ?' => $row['history_id']]);
                    }
                }
            } else
            if ($response && in_array($response->getStatusCode(), [200, 201])) {
                $ikad->addStatusHistoryComment("Created VC, history #{$row['history_id']}<br>$body")
                    ->save();
                $did = strlen($body) > 255
                    ? json_encode([
                        '_id' => $helperString->between($body, '"_id":"', '"'),
                        'status' => $helperString->between($body, '"status":"', '"'),
                    ])
                    : $body;
                $resource->update(['did' => $did], ['entity_id = ?' => $row['history_id']]);
                $cnt++;
            }
            $bodies[$userId] = $body;
            if (time() > $upto) {
                break;
            }
        }

        if ($io) {
            if ($errors) {
                $io->streamWrite("$cnt/$total: ERRORS:" . PHP_EOL);
                $io->streamWrite(json_encode($errors));
            } else {
                $io->streamWrite("$cnt/$total: NO ERRORS:");
            }
            $io->streamClose();
        }
        if ($schedule instanceof Mage_Cron_Model_Schedule) {
            $schedule->setMessages("$cnt/$total");
            if ($errors) {
                return $errors;
            }
        } else {
            return [
                'cnt' => $cnt,
                'errors' => $errors,
                'rows' => $rows,
                'bodies' => $bodies,
            ];
        }
    }

    /**
     * Revoke Ikad VC.
     * About 1.6 sec to revoke one VC.
     *
     * @param Mage_Cron_Model_Schedule|null $schedule
     * @return void
     */
    public function revokeIkadVc($schedule = null)
    {
        if ($schedule instanceof Mage_Cron_Model_Schedule && !Mage::getStoreConfigFlag('jim_api/smart_app/enabled')) {
            $schedule->setMessages('Cron disabled');
            return;
        }

        $io = $this->_getTestModeIoAdapter($schedule ? $schedule->getJobCode() . $schedule->getId() : 'smartapp_ikad_vc_revoke');
        $helper = Mage::helper('emgs/webService_smartAppSession');
        $singleton = Mage::getSingleton('core/date');
        $cnt = 0;
        $upto = strtotime('+55 mins');
        $errors = [];
        $resource = Mage::getResourceSingleton('mohe/ikad_status_history');
        $histories = $resource->getRevokedVcFailed();
        /** @var array $history {history_id: int, ikad_id: int, student_id: int, did: string} */
        foreach ($histories as $history) {
            $did = $history['did'];
            $credentialId = $did && json_validate($did)
                ? json_decode($did, true)['_id'] ?? null
                : null;
            if ($credentialId) {
                $response = null;
                try {
                    $response = $helper->call(
                        'PUT',
                        "identities/credentials/ikad/{$history['student_id']}/$credentialId",
                        ['status' => 'revoked']
                    );
                } catch (GuzzleHttp\Exception\RequestException $e) {
                    $response = $e->getResponse();
                } catch (GuzzleHttp\Exception\BadResponseException $e) {
                    $response = $e->getResponse();
                } catch (Throwable $e) {
                    $errors[$history['ikad_id']] = $e->getMessage();
                    continue;
                }
                $body = $response ? $response->getBody()->getContents() : '';
                $dt = $singleton->date('Y-m-d H:i:s');
                if ($io) {
                    $io->streamWrite($body . PHP_EOL);
                } else
                if ($response && $response->getStatusCode() === 200) {
                    $resource->update(
                        ['comment' => "VC revoked at $dt<br>$body"],
                        ['entity_id = ?' => $history['history_id']]
                    );
                    $cnt++;
                } else {
                    $resource->update(
                        ['comment' => "VC revoked failed at $dt<br>$body"],
                        ['entity_id = ?' => $history['history_id']]
                    );
                    $errors[$history['ikad_id']] = $body;
                }
            }
            if (time() > $upto) {
                break;
            }
        }

        if ($io) {
            if ($errors) {
                $io->streamWrite('ERRORS:' . PHP_EOL);
                $io->streamWrite(json_encode($errors));
            } else {
                $io->streamWrite('NO ERROR');
            }
            $io->streamClose();
        }
        if ($schedule instanceof Mage_Cron_Model_Schedule) {
            $total = count($histories);
            $schedule->setMessages("$cnt/$total");
            if ($errors) {
                return $errors;
            }
        } else {
            return [
                'cnt' => $cnt,
                'errors' => $errors,
                'histories' => $histories,
            ];
        }
    }
}
