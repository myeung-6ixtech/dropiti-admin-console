// Property Configuration - Centralized standardized values for property fields
export interface PropertyTypeOption {
  value: string;
  label: string;
  description?: string;
  category?: 'residential' | 'commercial' | 'industrial' | 'land';
}

export interface RentalSpaceOption {
  value: string;
  label: string;
  description?: string;
}

export interface AreaUnitOption {
  value: string;
  label: string;
  symbol: string;
  conversionToSqM?: number;
}

export interface FurnishedOption {
  value: string;
  label: string;
  description?: string;
}

export interface CurrencyOption {
  value: string;
  label: string;
  symbol: string;
  code: string;
}

export interface AmenitiesConfig {
  kitchen: AmenityOption[];
  bathroom: AmenityOption[];
  furnitures: AmenityOption[];
  additionals: AmenityOption[];
  electricalAppliances: AmenityOption[];
}

export interface AmenityOption {
  value: string;
  label: string;
  category: string;
  icon?: string;
}

export interface CountryOption {
  value: string;
  label: string;
  code: string;
  phoneCode?: string;
}

export interface StateOption {
  value: string;
  label: string;
  countryCode: string;
}

export interface DistrictOption {
  value: string;
  label: string;
  stateValue: string;
}

export interface PropertyFieldConfig {
  propertyTypes: PropertyTypeOption[];
  rentalSpaces: RentalSpaceOption[];
  areaUnits: AreaUnitOption[];
  furnishedOptions: FurnishedOption[];
  currencies: CurrencyOption[];
  amenities: AmenitiesConfig;
  countries: CountryOption[];
  states: StateOption[];
  districts: DistrictOption[];
}

// Default configuration with standardized values
export const DEFAULT_PROPERTY_CONFIG: PropertyFieldConfig = {
  propertyTypes: [
    { value: 'apartment', label: 'Apartment', category: 'residential' },
    { value: 'condominium', label: 'Condominium', category: 'residential' },
    { value: 'house', label: 'House', category: 'residential' },
    { value: 'townhouse', label: 'Townhouse', category: 'residential' },
    { value: 'villa', label: 'Villa', category: 'residential' },
    { value: 'studio', label: 'Studio', category: 'residential' },
    { value: 'penthouse', label: 'Penthouse', category: 'residential' },
    { value: 'office', label: 'Office', category: 'commercial' },
    { value: 'retail', label: 'Retail Space', category: 'commercial' },
    { value: 'warehouse', label: 'Warehouse', category: 'industrial' },
    { value: 'land', label: 'Land', category: 'land' },
  ],

  rentalSpaces: [
    { value: 'entire_property', label: 'Entire Property' },
    { value: 'private_room', label: 'Private Room' },
    { value: 'shared_room', label: 'Shared Room' },
    { value: 'studio_unit', label: 'Studio Unit' },
    { value: 'serviced_apartment', label: 'Serviced Apartment' },
    { value: 'co_working_space', label: 'Co-working Space' },
  ],

  areaUnits: [
    { value: 'sq ft', label: 'Square Feet', symbol: 'sq ft', conversionToSqM: 0.092903 },
    { value: 'sq m', label: 'Square Meters', symbol: 'sq m', conversionToSqM: 1 },
    { value: 'sq yd', label: 'Square Yards', symbol: 'sq yd', conversionToSqM: 0.836127 },
    { value: 'acres', label: 'Acres', symbol: 'acres', conversionToSqM: 4046.86 },
    { value: 'hectares', label: 'Hectares', symbol: 'ha', conversionToSqM: 10000 },
  ],

  furnishedOptions: [
    { value: 'none', label: 'Unfurnished', description: 'No furniture provided' },
    { value: 'partial', label: 'Partially Furnished', description: 'Basic furniture included' },
    { value: 'full', label: 'Fully Furnished', description: 'Complete furniture package' },
    { value: 'luxury', label: 'Luxury Furnished', description: 'High-end furniture and appliances' },
  ],

  currencies: [
    { value: '$', label: 'US Dollar', symbol: '$', code: 'USD' },
    { value: '€', label: 'Euro', symbol: '€', code: 'EUR' },
    { value: '£', label: 'British Pound', symbol: '£', code: 'GBP' },
    { value: '¥', label: 'Japanese Yen', symbol: '¥', code: 'JPY' },
    { value: 'HK$', label: 'Hong Kong Dollar', symbol: 'HK$', code: 'HKD' },
    { value: 'S$', label: 'Singapore Dollar', symbol: 'S$', code: 'SGD' },
    { value: 'A$', label: 'Australian Dollar', symbol: 'A$', code: 'AUD' },
    { value: 'C$', label: 'Canadian Dollar', symbol: 'C$', code: 'CAD' },
  ],

  amenities: {
    kitchen: [
      { value: 'refrigerator', label: 'Refrigerator', category: 'kitchen' },
      { value: 'microwave', label: 'Microwave', category: 'kitchen' },
      { value: 'dishwasher', label: 'Dishwasher', category: 'kitchen' },
      { value: 'oven', label: 'Oven', category: 'kitchen' },
      { value: 'stove', label: 'Stove', category: 'kitchen' },
      { value: 'coffee_maker', label: 'Coffee Maker', category: 'kitchen' },
      { value: 'blender', label: 'Blender', category: 'kitchen' },
      { value: 'toaster', label: 'Toaster', category: 'kitchen' },
    ],
    bathroom: [
      { value: 'shower', label: 'Shower', category: 'bathroom' },
      { value: 'bathtub', label: 'Bathtub', category: 'bathroom' },
      { value: 'bidet', label: 'Bidet', category: 'bathroom' },
      { value: 'hair_dryer', label: 'Hair Dryer', category: 'bathroom' },
      { value: 'towel_rack', label: 'Towel Rack', category: 'bathroom' },
      { value: 'mirror', label: 'Mirror', category: 'bathroom' },
    ],
    furnitures: [
      { value: 'bed', label: 'Bed', category: 'furnitures' },
      { value: 'wardrobe', label: 'Wardrobe', category: 'furnitures' },
      { value: 'desk', label: 'Desk', category: 'furnitures' },
      { value: 'chair', label: 'Chair', category: 'furnitures' },
      { value: 'sofa', label: 'Sofa', category: 'furnitures' },
      { value: 'dining_table', label: 'Dining Table', category: 'furnitures' },
      { value: 'bookshelf', label: 'Bookshelf', category: 'furnitures' },
      { value: 'nightstand', label: 'Nightstand', category: 'furnitures' },
    ],
    additionals: [
      { value: 'balcony', label: 'Balcony', category: 'additionals' },
      { value: 'terrace', label: 'Terrace', category: 'additionals' },
      { value: 'garden', label: 'Garden', category: 'additionals' },
      { value: 'parking', label: 'Parking', category: 'additionals' },
      { value: 'gym', label: 'Gym', category: 'additionals' },
      { value: 'pool', label: 'Pool', category: 'additionals' },
      { value: 'elevator', label: 'Elevator', category: 'additionals' },
      { value: 'security', label: 'Security System', category: 'additionals' },
      { value: 'air_conditioning', label: 'Air Conditioning', category: 'additionals' },
      { value: 'heating', label: 'Heating', category: 'additionals' },
    ],
    electricalAppliances: [
      { value: 'tv', label: 'TV', category: 'electricalAppliances' },
      { value: 'wifi', label: 'WiFi', category: 'electricalAppliances' },
      { value: 'washing_machine', label: 'Washing Machine', category: 'electricalAppliances' },
      { value: 'dryer', label: 'Dryer', category: 'electricalAppliances' },
      { value: 'iron', label: 'Iron', category: 'electricalAppliances' },
      { value: 'vacuum_cleaner', label: 'Vacuum Cleaner', category: 'electricalAppliances' },
    ],
  },

  countries: [
    { value: 'united_states', label: 'United States', code: 'US', phoneCode: '+1' },
    { value: 'united_kingdom', label: 'United Kingdom', code: 'GB', phoneCode: '+44' },
    { value: 'germany', label: 'Germany', code: 'DE', phoneCode: '+49' },
    { value: 'france', label: 'France', code: 'FR', phoneCode: '+33' },
    { value: 'japan', label: 'Japan', code: 'JP', phoneCode: '+81' },
    { value: 'hong_kong', label: 'Hong Kong', code: 'HK', phoneCode: '+852' },
    { value: 'singapore', label: 'Singapore', code: 'SG', phoneCode: '+65' },
    { value: 'australia', label: 'Australia', code: 'AU', phoneCode: '+61' },
    { value: 'canada', label: 'Canada', code: 'CA', phoneCode: '+1' },
  ],

  states: [
    // US States
    { value: 'california', label: 'California', countryCode: 'US' },
    { value: 'new_york', label: 'New York', countryCode: 'US' },
    { value: 'texas', label: 'Texas', countryCode: 'US' },
    { value: 'florida', label: 'Florida', countryCode: 'US' },
    { value: 'washington', label: 'Washington', countryCode: 'US' },
    // UK Regions
    { value: 'england', label: 'England', countryCode: 'GB' },
    { value: 'scotland', label: 'Scotland', countryCode: 'GB' },
    { value: 'wales', label: 'Wales', countryCode: 'GB' },
    { value: 'northern_ireland', label: 'Northern Ireland', countryCode: 'GB' },
  ],

  districts: [
    // California Districts
    { value: 'los_angeles', label: 'Los Angeles', stateValue: 'california' },
    { value: 'san_francisco', label: 'San Francisco', stateValue: 'california' },
    { value: 'san_diego', label: 'San Diego', stateValue: 'california' },
    // New York Districts
    { value: 'manhattan', label: 'Manhattan', stateValue: 'new_york' },
    { value: 'brooklyn', label: 'Brooklyn', stateValue: 'new_york' },
    { value: 'queens', label: 'Queens', stateValue: 'new_york' },
    { value: 'bronx', label: 'Bronx', stateValue: 'new_york' },
    { value: 'staten_island', label: 'Staten Island', stateValue: 'new_york' },
  ],
};

// Utility functions for working with the configuration
export class PropertyConfigUtils {
  static getPropertyTypeLabel(value: string): string {
    const option = DEFAULT_PROPERTY_CONFIG.propertyTypes.find(opt => opt.value === value);
    return option?.label || value;
  }

  static getRentalSpaceLabel(value: string): string {
    const option = DEFAULT_PROPERTY_CONFIG.rentalSpaces.find(opt => opt.value === value);
    return option?.label || value;
  }

  static getAreaUnitLabel(value: string): string {
    const option = DEFAULT_PROPERTY_CONFIG.areaUnits.find(opt => opt.value === value);
    return option?.label || value;
  }

  static getFurnishedLabel(value: string): string {
    const option = DEFAULT_PROPERTY_CONFIG.furnishedOptions.find(opt => opt.value === value);
    return option?.label || value;
  }

  static getCurrencyLabel(value: string): string {
    const option = DEFAULT_PROPERTY_CONFIG.currencies.find(opt => opt.value === value);
    return option?.label || value;
  }

  static getAmenityLabel(value: string, category: keyof AmenitiesConfig): string {
    const amenities = DEFAULT_PROPERTY_CONFIG.amenities[category];
    const option = amenities.find(opt => opt.value === value);
    return option?.label || value;
  }

  static getCountryLabel(value: string): string {
    const option = DEFAULT_PROPERTY_CONFIG.countries.find(opt => opt.value === value);
    return option?.label || value;
  }

  static getStateLabel(value: string): string {
    const option = DEFAULT_PROPERTY_CONFIG.states.find(opt => opt.value === value);
    return option?.label || value;
  }

  static getDistrictLabel(value: string): string {
    const option = DEFAULT_PROPERTY_CONFIG.districts.find(opt => opt.value === value);
    return option?.label || value;
  }

  static getStatesByCountry(countryCode: string): StateOption[] {
    return DEFAULT_PROPERTY_CONFIG.states.filter(state => state.countryCode === countryCode);
  }

  static getDistrictsByState(stateValue: string): DistrictOption[] {
    return DEFAULT_PROPERTY_CONFIG.districts.filter(district => district.stateValue === stateValue);
  }

  static validatePropertyType(value: string): boolean {
    return DEFAULT_PROPERTY_CONFIG.propertyTypes.some(opt => opt.value === value);
  }

  static validateRentalSpace(value: string): boolean {
    return DEFAULT_PROPERTY_CONFIG.rentalSpaces.some(opt => opt.value === value);
  }

  static validateFurnished(value: string): boolean {
    return DEFAULT_PROPERTY_CONFIG.furnishedOptions.some(opt => opt.value === value);
  }

  static validateCurrency(value: string): boolean {
    return DEFAULT_PROPERTY_CONFIG.currencies.some(opt => opt.value === value);
  }
}
