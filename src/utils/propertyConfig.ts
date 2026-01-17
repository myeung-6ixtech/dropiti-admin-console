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

export interface ResidentialTypeOption {
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
  residentialTypes: ResidentialTypeOption[];
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
    { value: 'residential', label: 'Residential', category: 'residential' },
    { value: 'commercial', label: 'Commercial', category: 'commercial' },
  ],

  residentialTypes: [
    { value: 'serviced-apartment', label: 'Serviced Apartment', description: 'Apartment with hotel-like services' },
    { value: 'village-house', label: 'Village House', description: 'Standalone house in village areas' },
    { value: 'apartment', label: 'Apartment', description: 'Standard residential unit' },
    { value: 'condo', label: 'Condominium', description: 'Property in condo complex' },
  ],

  rentalSpaces: [
    { value: 'entire-apartment', label: 'Entire Apartment', description: 'Complete apartment with private bathroom and kitchen' },
    { value: 'partial-apartment', label: 'Partial Apartment', description: 'Own room, shared common areas' },
    { value: 'shared-space', label: 'Shared Space', description: 'Shared room or space with others' },
    { value: 'private-room', label: 'Private Room', description: 'Private room, shared common areas' },
  ],

  areaUnits: [
    { value: 'sq ft', label: 'Square Feet', symbol: 'sq ft', conversionToSqM: 0.092903 },
    { value: 'sq m', label: 'Square Meters', symbol: 'sq m', conversionToSqM: 1 },
    { value: 'sq yd', label: 'Square Yards', symbol: 'sq yd', conversionToSqM: 0.836127 },
    { value: 'acres', label: 'Acres', symbol: 'acres', conversionToSqM: 4046.86 },
    { value: 'hectares', label: 'Hectares', symbol: 'ha', conversionToSqM: 10000 },
  ],

  furnishedOptions: [
    { value: 'non-furnished', label: 'Non-Furnished', description: 'Empty unit' },
    { value: 'partially', label: 'Partially Furnished', description: 'Some furniture and basic appliances' },
    { value: 'fully', label: 'Fully Furnished', description: 'All furniture and appliances' },
  ],

  currencies: [
    { value: 'HKD', label: 'Hong Kong Dollar', symbol: 'HK$', code: 'HKD' },
    { value: 'USD', label: 'US Dollar', symbol: '$', code: 'USD' },
    { value: 'EUR', label: 'Euro', symbol: '€', code: 'EUR' },
    { value: 'GBP', label: 'British Pound', symbol: '£', code: 'GBP' },
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
    { value: 'HK', label: 'Hong Kong', code: 'HK', phoneCode: '+852' },
    { value: 'MO', label: 'Macau', code: 'MO', phoneCode: '+853' },
  ],

  states: [],

  districts: [
    // Hong Kong - Hong Kong Island
    { value: 'central-western', label: 'Central and Western', stateValue: 'HK' },
    { value: 'eastern', label: 'Eastern', stateValue: 'HK' },
    { value: 'southern', label: 'Southern', stateValue: 'HK' },
    { value: 'wan-chai', label: 'Wan Chai', stateValue: 'HK' },
    // Hong Kong - Kowloon
    { value: 'sham-shui-po', label: 'Sham Shui Po', stateValue: 'HK' },
    { value: 'kowloon-city', label: 'Kowloon City', stateValue: 'HK' },
    { value: 'kwun-tong', label: 'Kwun Tong', stateValue: 'HK' },
    { value: 'wong-tai-sin', label: 'Wong Tai Sin', stateValue: 'HK' },
    { value: 'yau-tsim-mong', label: 'Yau Tsim Mong', stateValue: 'HK' },
    // Hong Kong - New Territories
    { value: 'islands', label: 'Islands', stateValue: 'HK' },
    { value: 'kwai-tsing', label: 'Kwai Tsing', stateValue: 'HK' },
    { value: 'north', label: 'North', stateValue: 'HK' },
    { value: 'sai-kung', label: 'Sai Kung', stateValue: 'HK' },
    { value: 'sha-tin', label: 'Sha Tin', stateValue: 'HK' },
    { value: 'tai-po', label: 'Tai Po', stateValue: 'HK' },
    { value: 'tsuen-wan', label: 'Tsuen Wan', stateValue: 'HK' },
    { value: 'tuen-mun', label: 'Tuen Mun', stateValue: 'HK' },
    { value: 'yuen-long', label: 'Yuen Long', stateValue: 'HK' },
    // Macau
    { value: 'nossa-senhora-fatima', label: 'Nossa Senhora de Fátima', stateValue: 'MO' },
    { value: 'santo-antonio', label: 'Santo António', stateValue: 'MO' },
    { value: 'se', label: 'Sé', stateValue: 'MO' },
    { value: 'sao-lazaro', label: 'São Lázaro', stateValue: 'MO' },
    { value: 'sao-lourenco', label: 'São Lourenço', stateValue: 'MO' },
    { value: 'taipa', label: 'Taipa', stateValue: 'MO' },
    { value: 'coloane', label: 'Coloane', stateValue: 'MO' },
    { value: 'cotai', label: 'Cotai', stateValue: 'MO' },
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
