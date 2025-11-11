# Dropiti Admin Console - UI/UX Design Principles (v1)

## Table of Contents
- [Design Philosophy](#design-philosophy)
- [Color System](#color-system)
- [Typography](#typography)
- [Layout & Spacing](#layout--spacing)
- [Component Library](#component-library)
- [Icons & Visual Elements](#icons--visual-elements)
- [Forms & Inputs](#forms--inputs)
- [Navigation](#navigation)
- [Cards & Content](#cards--content)
- [Responsive Design](#responsive-design)
- [Accessibility](#accessibility)
- [Best Practices](#best-practices)

## Design Philosophy

The Dropiti Admin Console follows modern design principles with emphasis on:

- **Clean & Minimal**: Reduced visual clutter with purposeful use of white space
- **Professional**: Business-focused aesthetic suitable for financial/real estate admin interfaces
- **Consistent**: Systematic approach to spacing, colors, and component behavior
- **Accessible**: WCAG compliant design with proper contrast ratios and focus indicators
- **Responsive**: Mobile-first approach with progressive enhancement

## Color System

### Color Palette Structure

The design system uses a comprehensive color palette with 11 shades (50-950) for each color family:

#### Primary Colors
```css
/* Neon Blue - Primary Brand Color */
--primary-50: #ecf0ff
--primary-100: #dde3ff
--primary-200: #c2cbff
--primary-300: #9ca7ff
--primary-400: #7578ff
--primary-500: #635bff  /* Main */
--primary-600: #4e36f5
--primary-700: #432ad8
--primary-800: #3725ae
--primary-900: #302689
--primary-950: #1e1650
```

#### Secondary Colors
```css
/* Nevada Gray - Secondary */
--secondary-50: #fbfcfe
--secondary-100: #f0f4f8
--secondary-200: #dde7ee
--secondary-300: #cdd7e1
--secondary-400: #9fa6ad
--secondary-500: #636b74
--secondary-600: #555e68
--secondary-700: #32383e
--secondary-800: #202427
--secondary-900: #121517
--secondary-950: #090a0b
```

#### Status Colors

**Success (Kepple Green)**
```css
--success-light: #5fe9ce (light mode: #2ed3b8)
--success-main: #15b79f
--success-dark: #0e9382
```

**Warning (California Orange)**
```css
--warning-light: #ffd049 (light mode: #ffbb1f)
--warning-main: #fb9c0c
--warning-dark: #de7101
```

**Error (Red Orange)**
```css
--error-light: #fdaaa4 (light mode: #f97970)
--error-main: #f04438
--error-dark: #de3024
```

**Info (Shakespeare Blue)**
```css
--info-light: #66e0fa (light mode: #10bee8)
--info-main: #04aad6
--info-dark: #0787b3
```

### Dark/Light Mode Support

The color system supports both light and dark themes:

#### Light Mode
- Background: `#ffffff` (white)
- Paper: `#ffffff` (white)
- Text Primary: `#212636` (dark gray)
- Text Secondary: `#667085` (medium gray)

#### Dark Mode
- Background: `#090a0b` (near black)
- Paper: `#121517` (dark gray)
- Text Primary: `#f0f4f8` (light gray)
- Text Secondary: `#9fa6ad` (medium gray)

## Typography

### Font Family
```css
font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"
```

### Typography Scale

| Variant | Font Size | Font Weight | Line Height | Use Case |
|---------|-----------|-------------|-------------|----------|
| `h1` | 3.5rem (56px) | 500 | 1.2 | Page titles, hero headings |
| `h2` | 3rem (48px) | 500 | 1.2 | Section headers |
| `h3` | 2.25rem (36px) | 500 | 1.2 | Subsection headers |
| `h4` | 2rem (32px) | 500 | 1.2 | Card titles |
| `h5` | 1.5rem (24px) | 500 | 1.2 | Component headers |
| `h6` | 1.125rem (18px) | 500 | 1.2 | Small headers |
| `subtitle1` | 1rem (16px) | 500 | 1.57 | Important body text |
| `subtitle2` | 0.875rem (14px) | 500 | 1.57 | Secondary headings |
| `body1` | 1rem (16px) | 400 | 1.5 | Primary body text |
| `body2` | 0.875rem (14px) | 400 | 1.57 | Secondary body text |
| `caption` | 0.75rem (12px) | 400 | 1.66 | Captions, labels |
| `overline` | 0.75rem (12px) | 500 | 2.5 | Overline text, uppercase |
| `button` | inherited | 500 | inherited | Button text |

### Typography Usage Examples

```tsx
// Page Title
<Typography variant="h4">Payment Management</Typography>

// Section Header
<Typography variant="h6" sx={{ mb: 2 }}>
  Payment Details
</Typography>

// Body Text
<Typography variant="body2" color="text.secondary">
  This payment was processed on {date}
</Typography>

// Overline (Status Labels)
<Typography variant="overline" color="text.secondary">
  Payment Status
</Typography>
```

## Layout & Spacing

### Spacing System

The spacing system uses an 8px base unit with consistent multipliers:

```css
/* CSS Custom Properties for spacing */
spacing(1) = 8px
spacing(2) = 16px
spacing(3) = 24px
spacing(4) = 32px
spacing(6) = 48px
spacing(8) = 64px
```

### Grid System

Uses Material-UI's 12-column grid with responsive breakpoints:

```typescript
breakpoints: {
  xs: 0,
  sm: 600px,
  md: 900px,
  lg: 1200px,
  xl: 1440px
}
```

### Common Layout Patterns

#### Page Structure
```tsx
<Stack spacing={3}>
  {/* Page Header */}
  <Stack direction="row" spacing={3}>
    <Stack spacing={1} sx={{ flex: "1 1 auto" }}>
      <Typography variant="h4">Page Title</Typography>
    </Stack>
    <div>
      <Button variant="contained" startIcon={<PlusIcon />}>
        Add New
      </Button>
    </div>
  </Stack>
  
  {/* Filters */}
  <FiltersComponent />
  
  {/* Content Grid */}
  <Grid container spacing={3}>
    <Grid xs={12} md={6} lg={4}>
      <Card>...</Card>
    </Grid>
  </Grid>
</Stack>
```

#### Two-Column Layout
```tsx
<Grid container spacing={3}>
  <Grid xs={12} md={8}>
    {/* Main content */}
  </Grid>
  <Grid xs={12} md={4}>
    {/* Sidebar content */}
  </Grid>
</Grid>
```

## Component Library

### Buttons

#### Button Variants
```tsx
// Primary action
<Button variant="contained">Save Changes</Button>

// Secondary action  
<Button variant="outlined">Cancel</Button>

// Tertiary action
<Button variant="text">Learn More</Button>
```

#### Button Styling
- Border radius: `12px`
- Text transform: `none` (no uppercase)
- Padding:
  - Small: `6px 16px`
  - Medium: `8px 20px` 
  - Large: `11px 24px`

#### Button Usage Patterns
```tsx
// Action buttons (right-aligned)
<Stack direction="row" spacing={2} justifyContent="flex-end">
  <Button variant="outlined">Cancel</Button>
  <Button variant="contained">Save</Button>
</Stack>

// Button with icon
<Button 
  variant="contained" 
  startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
>
  Add New
</Button>
```

### Cards

#### Card Structure
```tsx
<Card>
  <CardHeader 
    title="Card Title"
    subheader="Optional subtitle"
  />
  <Divider />
  <CardContent>
    {/* Card content */}
  </CardContent>
  <Divider />
  <CardActions sx={{ justifyContent: 'flex-end' }}>
    <Button variant="contained">Action</Button>
  </CardActions>
</Card>
```

#### Card Styling
- Border radius: `20px`
- Elevation: Custom shadow system
- Padding:
  - CardHeader: `32px 24px 16px`
  - CardContent: `32px 24px`
  - CardActions: Default with right alignment

### Tables

#### Table Styling
```tsx
<TableHead>
  {/* Styled with background-level1 and secondary text */}
</TableHead>
<TableBody>
  <TableRow>
    <TableCell>{data}</TableCell>
  </TableRow>
</TableBody>
```

## Icons & Visual Elements

### Icon System

Uses Phosphor Icons with consistent sizing:

```css
:root {
  --icon-fontSize-sm: 1rem;      /* 16px */
  --icon-fontSize-md: 1.25rem;   /* 20px */  
  --icon-fontSize-lg: 1.5rem;    /* 24px */
}
```

#### Icon Usage
```tsx
// Standard icon in button
<Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}>
  Add New
</Button>

// Large icon in card
<Avatar sx={{ backgroundColor: 'var(--mui-palette-primary-main)' }}>
  <ReceiptIcon fontSize="var(--icon-fontSize-lg)" />
</Avatar>

// Small icon in text
<ClockIcon fontSize="var(--icon-fontSize-sm)" />
```

### Avatar Styling
```css
.MuiAvatar-root {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
}
```

### Shadows
Custom shadow system with 24 levels using consistent `rgba(0, 0, 0, 0.08)` opacity.

## Forms & Inputs

### Form Structure
```tsx
<form onSubmit={handleSubmit}>
  <Card>
    <CardHeader title="Form Title" />
    <CardContent>
      <Stack spacing={3}>
        {/* Form sections */}
        <Stack spacing={2}>
          <Typography variant="h6">Section Title</Typography>
          <Stack spacing={2}>
            {/* Form fields */}
          </Stack>
        </Stack>
      </Stack>
    </CardContent>
    <Divider />
    <CardActions sx={{ justifyContent: 'flex-end' }}>
      <Button variant="outlined">Cancel</Button>
      <Button type="submit" variant="contained">Submit</Button>
    </CardActions>
  </Card>
</form>
```

### Input Patterns

#### Text Input
```tsx
<FormControl fullWidth>
  <InputLabel>Field Label</InputLabel>
  <OutlinedInput
    label="Field Label"
    value={value}
    onChange={handleChange}
    placeholder="Placeholder text"
  />
</FormControl>
```

#### Select Input
```tsx
<FormControl fullWidth>
  <InputLabel>Select Label</InputLabel>
  <Select
    label="Select Label"
    value={value}
    onChange={handleChange}
  >
    <MenuItem value="option1">Option 1</MenuItem>
    <MenuItem value="option2">Option 2</MenuItem>
  </Select>
</FormControl>
```

#### Search Input
```tsx
<OutlinedInput
  fullWidth
  placeholder="Search..."
  startAdornment={
    <InputAdornment position="start">
      <MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
    </InputAdornment>
  }
  sx={{ maxWidth: '500px' }}
/>
```

## Navigation

### Side Navigation Structure
```css
/* Navigation CSS Variables */
--SideNav-background: var(--mui-palette-neutral-950)
--SideNav-color: var(--mui-palette-common-white)
--NavItem-color: var(--mui-palette-neutral-300)
--NavItem-hover-background: rgba(255, 255, 255, 0.04)
--NavItem-active-background: var(--mui-palette-primary-main)
--NavItem-active-color: var(--mui-palette-primary-contrastText)
```

### Navigation Item Pattern
```tsx
<Box
  sx={{
    alignItems: 'center',
    borderRadius: 1,
    color: 'var(--NavItem-color)',
    display: 'flex',
    gap: 1,
    p: '6px 16px',
    '&:hover': {
      bgcolor: 'var(--NavItem-hover-background)',
    },
    '&.active': {
      bgcolor: 'var(--NavItem-active-background)',
      color: 'var(--NavItem-active-color)',
    }
  }}
>
  <Icon fontSize="var(--icon-fontSize-md)" />
  <Typography variant="body2">Nav Item</Typography>
</Box>
```

## Cards & Content

### Card Variants

#### Overview Card (Dashboard Metrics)
```tsx
<Card>
  <CardContent>
    <Stack direction="row" spacing={3} justifyContent="space-between">
      <Stack spacing={1}>
        <Typography variant="overline" color="text.secondary">
          Metric Label
        </Typography>
        <Typography variant="h4">{value}</Typography>
      </Stack>
      <Avatar sx={{ 
        backgroundColor: 'var(--mui-palette-primary-main)',
        height: '56px', 
        width: '56px' 
      }}>
        <Icon fontSize="var(--icon-fontSize-lg)" />
      </Avatar>
    </Stack>
  </CardContent>
</Card>
```

#### List Card
```tsx
<Card>
  <CardHeader title="List Title" />
  <Divider />
  <List>
    {items.map((item) => (
      <ListItem key={item.id} divider>
        <ListItemAvatar>
          <Avatar src={item.image} />
        </ListItemAvatar>
        <ListItemText
          primary={item.title}
          secondary={item.description}
        />
      </ListItem>
    ))}
  </List>
</Card>
```

## Responsive Design

### Breakpoint Usage

```tsx
// Responsive grid
<Grid xs={12} sm={6} md={4} lg={3}>
  <Card>...</Card>
</Grid>

// Responsive display
<Box sx={{ 
  display: { xs: 'none', lg: 'flex' }
}}>
  Desktop content
</Box>

// Responsive spacing
<Stack 
  direction={{ xs: 'column', md: 'row' }}
  spacing={2}
>
  <Item />
  <Item />
</Stack>
```

### Mobile Navigation
- Drawer-based navigation for mobile (`xs` breakpoint)
- Hamburger menu trigger
- Overlay behavior with backdrop

## Accessibility

### Focus Management
```css
*:focus-visible {
  outline: 2px solid var(--mui-palette-primary-main);
}
```

### Color Contrast
- All text meets WCAG AA contrast requirements
- Status colors provide sufficient contrast in both light and dark modes
- Interactive elements have proper focus indicators

### Semantic HTML
- Proper heading hierarchy (`h1` → `h6`)
- Form labels associated with inputs
- ARIA attributes where needed
- Semantic navigation structure

## Best Practices

### Layout Guidelines

1. **Consistent Spacing**: Use the 8px spacing system consistently
2. **Visual Hierarchy**: Use typography scale to establish clear hierarchy
3. **Grouping**: Related elements should be visually grouped using cards or sections
4. **Breathing Room**: Provide adequate white space between sections

### Component Patterns

1. **Page Header Pattern**:
   ```tsx
   <Stack direction="row" spacing={3}>
     <Stack spacing={1} sx={{ flex: "1 1 auto" }}>
       <Typography variant="h4">Page Title</Typography>
       <Typography variant="body2" color="text.secondary">
         Page description
       </Typography>
     </Stack>
     <div>
       <Button variant="contained">Primary Action</Button>
     </div>
   </Stack>
   ```

2. **Form Section Pattern**:
   ```tsx
   <Stack spacing={2}>
     <Typography variant="h6">Section Title</Typography>
     <Stack spacing={2}>
       {/* Form fields */}
     </Stack>
   </Stack>
   ```

3. **Action Button Pattern**:
   ```tsx
   <Stack direction="row" spacing={2} justifyContent="flex-end">
     <Button variant="outlined">Secondary</Button>
     <Button variant="contained">Primary</Button>
   </Stack>
   ```

### Performance Considerations

1. **Theme Variables**: Use CSS custom properties for dynamic theming
2. **Component Composition**: Prefer composition over prop drilling
3. **Responsive Images**: Use appropriate image sizes for different viewports
4. **Lazy Loading**: Implement for data-heavy components

### Code Organization

1. **Component Structure**: Keep components focused and single-purpose
2. **Style Consistency**: Use theme variables instead of hardcoded values
3. **Reusable Patterns**: Extract common patterns into reusable components
4. **Type Safety**: Maintain strict TypeScript typing for theme extensions

This design system ensures consistency, accessibility, and maintainability across the Dropiti Admin Console while providing a professional and modern user experience suitable for financial and real estate management applications. 