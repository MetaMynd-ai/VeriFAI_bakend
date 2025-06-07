import { JwtModuleOptions } from "@nestjs/jwt";

// Augment the existing IAuth namespace from @hsuite/types
declare module '@hsuite/types' { // Use the actual module name if it's different when imported
  namespace IAuth {
    namespace IConfiguration {
      interface IOptions {
        jwtRefresh?: { // Add jwtRefresh as an optional property
          secret: string;
          signOptions: {
            expiresIn: string;
          };
        };
      }
    }
  }
}

// It's important that this file is recognized by TypeScript as a global declaration file.
// Often, placing it in a 'types' directory within 'src' and ensuring your tsconfig.json
// includes this path (or 'src/**/*.d.ts') is sufficient.
// You might need to restart your TypeScript server/IDE for the changes to take effect.
