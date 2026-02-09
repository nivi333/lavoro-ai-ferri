import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from '../config/config';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Ayphen Textile - Textile Manufacturing ERP API',
    version: '1.0.0',
    description: `
      A comprehensive RESTful API for textile manufacturing ERP system with multi-tenant architecture.
      
      ## Features
      - Multi-tenant schema-per-tenant architecture
      - JWT-based authentication with refresh tokens
      - Role-based access control (OWNER, ADMIN, MANAGER, EMPLOYEE)
      - Rate limiting and security middleware
      - Comprehensive error handling
      - Real-time health monitoring
      
      ## Authentication
      Most endpoints require authentication. Include the JWT token in the Authorization header:
      \`Authorization: Bearer <your-jwt-token>\`
      
      ## Rate Limiting
      - Authentication endpoints: 5 requests per 15 minutes
      - General endpoints: 100 requests per 15 minutes
      - User endpoints: 1000 requests per 15 minutes
      
      ## Multi-Tenancy
      After authentication, use the switch-tenant endpoint to set your tenant context.
      All subsequent requests will operate within that tenant's scope.
    `,
    contact: {
      name: 'API Support',
      email: 'support@ayphen-textile.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://${config.host}:${config.port}/api/v1`,
      description: 'Development server',
    },
    {
      url: 'https://api.ayphen-textile.com/api/v1',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from login endpoint',
      },
    },
    schemas: {
      // Common schemas
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                example: 'VALIDATION_ERROR',
              },
              message: {
                type: 'string',
                example: 'Validation failed',
              },
              requestId: {
                type: 'string',
                example: 'req_1234567890_abc123',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2023-12-01T10:00:00.000Z',
              },
              details: {
                type: 'object',
                description: 'Additional error details (development only)',
              },
            },
          },
        },
      },

      // Authentication schemas
      LoginRequest: {
        type: 'object',
        required: ['emailOrPhone', 'password'],
        properties: {
          emailOrPhone: {
            type: 'string',
            description: 'Email address or phone number',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            description: 'User password',
            example: 'SecurePass123!',
          },
        },
      },

      RegisterRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'password'],
        properties: {
          firstName: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            example: 'John',
          },
          lastName: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            example: 'Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john.doe@example.com',
          },
          phone: {
            type: 'string',
            pattern: '^\\+?[1-9]\\d{1,14}$',
            example: '+1234567890',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            maxLength: 128,
            description:
              'Must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
            example: 'SecurePass123!',
          },
        },
      },

      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            description: 'JWT access token (expires in 1 hour)',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          refreshToken: {
            type: 'string',
            description: 'JWT refresh token (expires in 7 days)',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          expiresIn: {
            type: 'number',
            description: 'Access token expiration time in seconds',
            example: 3600,
          },
        },
      },

      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          firstName: {
            type: 'string',
            example: 'John',
          },
          lastName: {
            type: 'string',
            example: 'Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john.doe@example.com',
          },
          phone: {
            type: 'string',
            example: '+1234567890',
          },
          isActive: {
            type: 'boolean',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-12-01T10:00:00.000Z',
          },
        },
      },

      Company: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          name: {
            type: 'string',
            example: 'Acme Textiles Ltd.',
          },
          role: {
            type: 'string',
            enum: ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE'],
            example: 'ADMIN',
          },
          isActive: {
            type: 'boolean',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-12-01T10:00:00.000Z',
          },
        },
      },

      Session: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          userId: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          tenantId: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          deviceInfo: {
            type: 'string',
            example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          ipAddress: {
            type: 'string',
            example: '192.168.1.100',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-12-01T10:00:00.000Z',
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-12-08T10:00:00.000Z',
          },
        },
      },

      HealthStatus: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['OK', 'DEGRADED', 'ERROR'],
            example: 'OK',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2023-12-01T10:00:00.000Z',
          },
          uptime: {
            type: 'number',
            description: 'Server uptime in seconds',
            example: 3600,
          },
          environment: {
            type: 'string',
            example: 'development',
          },
          version: {
            type: 'string',
            example: '1.0.0',
          },
          services: {
            type: 'object',
            properties: {
              api: {
                type: 'string',
                example: 'healthy',
              },
              database: {
                type: 'string',
                example: 'healthy',
              },
              redis: {
                type: 'string',
                example: 'healthy',
              },
            },
          },
        },
      },
    },

    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: {
                type: 'AUTHENTICATION_ERROR',
                message: 'Authentication required',
                requestId: 'req_1234567890_abc123',
                timestamp: '2023-12-01T10:00:00.000Z',
              },
            },
          },
        },
      },

      ForbiddenError: {
        description: 'Access denied',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: {
                type: 'AUTHORIZATION_ERROR',
                message: 'Access denied',
                requestId: 'req_1234567890_abc123',
                timestamp: '2023-12-01T10:00:00.000Z',
              },
            },
          },
        },
      },

      ValidationError: {
        description: 'Validation failed',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: {
                type: 'VALIDATION_ERROR',
                message: 'Validation failed',
                requestId: 'req_1234567890_abc123',
                timestamp: '2023-12-01T10:00:00.000Z',
                details: [
                  {
                    field: 'email',
                    message: 'Email is required',
                  },
                ],
              },
            },
          },
        },
      },

      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: {
                type: 'RATE_LIMIT_ERROR',
                message: 'Too many requests, please try again later',
                requestId: 'req_1234567890_abc123',
                timestamp: '2023-12-01T10:00:00.000Z',
                retryAfter: 60,
              },
            },
          },
        },
      },

      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: {
                type: 'INTERNAL_SERVER_ERROR',
                message: 'Internal server error',
                requestId: 'req_1234567890_abc123',
                timestamp: '2023-12-01T10:00:00.000Z',
              },
            },
          },
        },
      },
    },
  },

  security: [
    {
      bearerAuth: [],
    },
  ],

  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and session management',
    },
    {
      name: 'Health',
      description: 'System health and monitoring endpoints',
    },
    {
      name: 'Companies',
      description: 'Multi-tenant company management (coming soon)',
    },
    {
      name: 'Locations',
      description: 'Location and facility management (coming soon)',
    },
    {
      name: 'Inventory',
      description: 'Inventory and stock management (coming soon)',
    },
    {
      name: 'Production',
      description: 'Production planning and tracking (coming soon)',
    },
    {
      name: 'Quality',
      description: 'Quality control and assurance (coming soon)',
    },
    {
      name: 'Reports',
      description: 'Analytics and reporting (coming soon)',
    },
  ],
};

// Options for swagger-jsdoc
const swaggerOptions = {
  definition: swaggerDefinition,
  apis: ['./src/routes/v1/*.ts', './src/controllers/*.ts', './src/docs/paths/*.yaml'],
};

// Generate swagger specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    requestInterceptor: (req: any) => {
      // Add request ID header
      req.headers['X-Request-ID'] =
        `swagger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return req;
    },
  },
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #3b4151; }
    .swagger-ui .scheme-container { background: #f7f7f7; padding: 15px; margin: 20px 0; }
  `,
  customSiteTitle: 'Ayphen Textile API Documentation',
};

/**
 * Setup Swagger documentation
 */
export const setupSwagger = (app: Express): void => {
  // Serve swagger documentation
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Serve swagger JSON
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📚 API Documentation available at: http://${config.host}:${config.port}/docs`);
};
