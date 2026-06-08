const { z } = require('zod');
const swaggerJSDoc = require('swagger-jsdoc');
const validation = require('../middlewares/validation.middleware');

// Helper to convert Zod schema to OpenAPI-compatible JSON schema
const toOpenApiSchema = (zodSchema) => {
  if (!zodSchema) return {};
  const schema = z.toJSONSchema(zodSchema, { target: 'open-api-3.0' });
  // Remove JSON Schema specific properties not valid/needed in OpenAPI components
  delete schema.$schema;
  return schema;
};

// Generate OpenAPI schemas from Zod schemas dynamically
const schemas = {
  RegisterSchema: toOpenApiSchema(validation.registerSchema),
  LoginSchema: toOpenApiSchema(validation.loginSchema),
  TravelBookingSchema: toOpenApiSchema(validation.travelBookingSchema),
  CharterRequestSchema: toOpenApiSchema(validation.charterRequestSchema),
  PackageShipmentSchema: toOpenApiSchema(validation.packageShipmentSchema),
  PackageStatusSchema: toOpenApiSchema(validation.packageStatusSchema),
  
  // Admin Schemas
  AdminFleetSchema: toOpenApiSchema(validation.adminValidationSchemas?.fleet),
  AdminRouteSchema: toOpenApiSchema(validation.adminValidationSchemas?.route),
  AdminScheduleSchema: toOpenApiSchema(validation.adminValidationSchemas?.schedule),
  AdminUserSchema: toOpenApiSchema(validation.adminValidationSchemas?.user),
  AdminBannerSchema: toOpenApiSchema(validation.adminValidationSchemas?.banner),
  AdminDestinationSchema: toOpenApiSchema(validation.adminValidationSchemas?.destination),
  AdminExpenseSchema: toOpenApiSchema(validation.adminValidationSchemas?.expense),
  
  // Driver Schemas
  DriverScheduleStatusSchema: toOpenApiSchema(validation.driverValidationSchemas?.scheduleStatus),
  
  // Mechanic Schemas
  MechanicFleetStatusSchema: toOpenApiSchema(validation.mechanicValidationSchemas?.fleetStatus),
  MechanicMaintenanceLogSchema: toOpenApiSchema(validation.mechanicValidationSchemas?.maintenanceLog)
};

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API PT. Rini Trans Putri',
      version: '1.0.0',
      description: 'Dokumentasi API resmi PT. Rini Trans Putri. Dilengkapi dengan otentikasi JWT Bearer token dan validasi skema Zod.',
      contact: {
        name: 'Rafael Pransa',
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Server Lokal (Development)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Masukkan JWT Token untuk mengakses endpoint terproteksi. Format: Bearer <token>'
        }
      },
      schemas: schemas
    }
  },
  // File route yang berisi JSDoc OpenAPI comments
  apis: ['./src/routes/*.js', './src/app.js']
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = swaggerSpec;
