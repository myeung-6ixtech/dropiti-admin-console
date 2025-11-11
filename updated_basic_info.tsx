// Editable Basic Info Card Component
const EditableBasicInfoCard: React.FC<{ 
  formData: Partial<RealEstatePropertyInsertInput>; 
  onInputChange: (field: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}> = ({ formData, onInputChange, onSave, onCancel, saving }) => {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
          Basic Information
        </h4>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
          <div>
            <Label>Title *</Label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => onInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <Label>Property Type *</Label>
            <select
              value={formData.property_type || ''}
              onChange={(e) => onInputChange('property_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select Property Type</option>
              {DEFAULT_PROPERTY_CONFIG.propertyTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Rental Space *</Label>
            <input
              type="text"
              value={formData.rental_space || ''}
              onChange={(e) => onInputChange('rental_space', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <Label>Rental Price</Label>
            <input
              type="number"
              value={formData.rental_price || ''}
              onChange={(e) => onInputChange('rental_price', parseFloat(e.target.value) || null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Label>Currency</Label>
            <select
              value={formData.rental_price_currency || '$'}
              onChange={(e) => onInputChange('rental_price_currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="$">USD ($)</option>
              <option value="€">EUR (€)</option>
              <option value="£">GBP (£)</option>
              <option value="¥">JPY (¥)</option>
            </select>
          </div>

          <div>
            <Label>Status</Label>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={formData.is_public || false}
                onChange={(e) => onInputChange('is_public', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Public Listing
              </span>
            </div>
          </div>
        </div>

        {formData.description !== undefined && (
          <div className="mt-6">
            <Label>Description</Label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => onInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}

        <div className="flex flex-col gap-3 lg:flex-row mt-6">
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
