import { executeQuery, executeMutation } from '../client';
import { 
  PaginationInput,
  PaginatedResponse 
} from '../types';

// Define the RealEstateUser type based on the query
export interface RealEstateUser {
  firebase_uid: string;
  auth_provider: string;
  display_name: string;
  email: string;
  photo_url?: string;
  user_since: string;
  phone_number: string;
}

export interface RealEstateUserInsertInput {
  firebase_uid: string;
  auth_provider: string;
  display_name: string;
  email: string;
  photo_url?: string;
  phone_number: string;
}

// GraphQL queries and mutations
const GET_REAL_ESTATE_USERS = `
  query GetRealEstateUsers($limit: Int, $offset: Int) {
    real_estate_user(limit: $limit, offset: $offset, order_by: {user_since: desc}) {
      firebase_uid
      auth_provider
      display_name
      email
      photo_url
      user_since
      phone_number
    }
    real_estate_user_aggregate {
      aggregate {
        count
      }
    }
  }
`;

const GET_REAL_ESTATE_USER_BY_UID = `
  query GetRealEstateUserByUid($firebase_uid: String!) {
    real_estate_user(where: {firebase_uid: {_eq: $firebase_uid}}, limit: 1) {
      firebase_uid
      auth_provider
      display_name
      email
      photo_url
      user_since
      phone_number
    }
  }
`;

const GET_REAL_ESTATE_USER_BY_EMAIL = `
  query GetRealEstateUserByEmail($email: String!) {
    real_estate_user(where: {email: {_eq: $email}}, limit: 1) {
      firebase_uid
      auth_provider
      display_name
      email
      photo_url
      user_since
      phone_number
    }
  }
`;

const INSERT_REAL_ESTATE_USER = `
  mutation InsertRealEstateUser($object: real_estate_user_insert_input!) {
    insert_real_estate_user_one(object: $object) {
      firebase_uid
      auth_provider
      display_name
      email
      photo_url
      user_since
      phone_number
    }
  }
`;

const UPDATE_REAL_ESTATE_USER = `
  mutation UpdateRealEstateUser($firebase_uid: String!, $set: real_estate_user_set_input!) {
    update_real_estate_user(
      where: {firebase_uid: {_eq: $firebase_uid}}
      _set: $set
    ) {
      affected_rows
      returning {
        firebase_uid
        auth_provider
        display_name
        email
        photo_url
        user_since
        phone_number
      }
    }
  }
`;

const DELETE_REAL_ESTATE_USER = `
  mutation DeleteRealEstateUser($firebase_uid: String!) {
    delete_real_estate_user(where: {firebase_uid: {_eq: $firebase_uid}}) {
      affected_rows
      returning {
        firebase_uid
        display_name
        email
      }
    }
  }
`;

// Service functions
export class RealEstateUserService {
  // Get all real estate users with pagination
  static async getRealEstateUsers(
    pagination?: PaginationInput
  ): Promise<PaginatedResponse<RealEstateUser>> {
    const variables = {
      limit: pagination?.limit || 10,
      offset: pagination?.offset || 0,
    };

    const result = await executeQuery<{
      real_estate_user: RealEstateUser[];
      real_estate_user_aggregate: {
        aggregate: { count: number };
      };
    }>(GET_REAL_ESTATE_USERS, variables);

    return {
      data: result.real_estate_user,
      total: result.real_estate_user_aggregate.aggregate.count,
      hasMore: (pagination?.offset || 0) + (pagination?.limit || 10) < result.real_estate_user_aggregate.aggregate.count,
    };
  }

  // Get a single user by Firebase UID
  static async getRealEstateUserByUid(firebaseUid: string): Promise<RealEstateUser | null> {
    const result = await executeQuery<{
      real_estate_user: RealEstateUser[];
    }>(GET_REAL_ESTATE_USER_BY_UID, { firebase_uid: firebaseUid });

    return result.real_estate_user[0] || null;
  }

  // Get a single user by email
  static async getRealEstateUserByEmail(email: string): Promise<RealEstateUser | null> {
    const result = await executeQuery<{
      real_estate_user: RealEstateUser[];
    }>(GET_REAL_ESTATE_USER_BY_EMAIL, { email });

    return result.real_estate_user[0] || null;
  }

  // Create a new real estate user
  static async createRealEstateUser(
    user: RealEstateUserInsertInput
  ): Promise<RealEstateUser> {
    const result = await executeMutation<{
      insert_real_estate_user_one: RealEstateUser;
    }>(INSERT_REAL_ESTATE_USER, { object: user });

    return result.insert_real_estate_user_one;
  }

  // Update an existing real estate user
  static async updateRealEstateUser(
    firebaseUid: string,
    updates: Partial<RealEstateUserInsertInput>
  ): Promise<RealEstateUser | null> {
    const result = await executeMutation<{
      update_real_estate_user: {
        affected_rows: number;
        returning: RealEstateUser[];
      };
    }>(UPDATE_REAL_ESTATE_USER, { firebase_uid: firebaseUid, set: updates });

    return result.update_real_estate_user.returning[0] || null;
  }

  // Delete a real estate user
  static async deleteRealEstateUser(firebaseUid: string): Promise<{ firebase_uid: string; display_name: string; email: string } | null> {
    const result = await executeMutation<{
      delete_real_estate_user: {
        affected_rows: number;
        returning: { firebase_uid: string; display_name: string; email: string }[];
      };
    }>(DELETE_REAL_ESTATE_USER, { firebase_uid: firebaseUid });

    return result.delete_real_estate_user.returning[0] || null;
  }

  // Search users by display name or email
  static async searchRealEstateUsers(searchTerm: string, pagination?: PaginationInput): Promise<RealEstateUser[]> {
    const SEARCH_REAL_ESTATE_USERS = `
      query SearchRealEstateUsers($searchTerm: String!, $limit: Int, $offset: Int) {
        real_estate_user(
          where: {
            _or: [
              {display_name: {_ilike: $searchTerm}},
              {email: {_ilike: $searchTerm}}
            ]
          }
          limit: $limit
          offset: $offset
          order_by: {user_since: desc}
        ) {
          firebase_uid
          auth_provider
          display_name
          email
          photo_url
          user_since
          phone_number
        }
      }
    `;

    const variables = {
      searchTerm: `%${searchTerm}%`,
      limit: pagination?.limit || 10,
      offset: pagination?.offset || 0,
    };

    const result = await executeQuery<{
      real_estate_user: RealEstateUser[];
    }>(SEARCH_REAL_ESTATE_USERS, variables);

    return result.real_estate_user;
  }

  // Get users by auth provider
  static async getRealEstateUsersByAuthProvider(authProvider: string, pagination?: PaginationInput): Promise<RealEstateUser[]> {
    const GET_USERS_BY_AUTH_PROVIDER = `
      query GetRealEstateUsersByAuthProvider($authProvider: String!, $limit: Int, $offset: Int) {
        real_estate_user(
          where: {auth_provider: {_eq: $authProvider}}
          limit: $limit
          offset: $offset
          order_by: {user_since: desc}
        ) {
          firebase_uid
          auth_provider
          display_name
          email
          photo_url
          user_since
          phone_number
        }
      }
    `;

    const variables = {
      authProvider,
      limit: pagination?.limit || 10,
      offset: pagination?.offset || 0,
    };

    const result = await executeQuery<{
      real_estate_user: RealEstateUser[];
    }>(GET_USERS_BY_AUTH_PROVIDER, variables);

    return result.real_estate_user;
  }

  // Check if user exists by Firebase UID
  static async userExists(firebaseUid: string): Promise<boolean> {
    const user = await this.getRealEstateUserByUid(firebaseUid);
    return user !== null;
  }

  // Check if user exists by email
  static async userExistsByEmail(email: string): Promise<boolean> {
    const user = await this.getRealEstateUserByEmail(email);
    return user !== null;
  }
} 