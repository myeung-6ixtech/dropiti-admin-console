// Export the main client
export { 
  hasuraClient, 
  createUserClient, 
  hasuraEndpoint,
  executeQuery,
  executeMutation,
  executeSubscription 
} from './client';

// Export types
export * from './types';

// Export services
export { RealEstateService } from './services/realEstateService';
export { RealEstateUserService } from './services/realEstateUserService';
export { RealEstatePropertyService } from './services/realEstatePropertyService'; 