# Professional SKU System for WallDecorator

## 📋 Overview

This document explains the professional SKU (Stock Keeping Unit) generation system implemented in the WallDecorator e-commerce platform.

## 🏗️ SKU Structure

### Base Product SKU Format
```
WD-{CATEGORY}-{PRODUCT}-{SEQUENCE}
```

### Components Breakdown

1. **Brand Prefix (WD)**
   - Fixed prefix for WallDecorator brand
   - Instantly identifies your products across all systems
   - Example: `WD-`

2. **Category Code (3-4 letters)**
   - Automatically extracted from selected category
   - Groups products for inventory management
   - Defaults to "GEN" (General) if no category selected
   - Examples:
     - WALL → Wall Art
     - SCUL → Sculptures
     - DECO → Decorations
     - MIRR → Mirrors

3. **Product Code (8 characters)**
   - Extracted from product name
   - Uses alphanumeric characters only
   - Makes SKU human-readable
   - Examples:
     - "Geometric Lion Head" → GEOLION
     - "Abstract Metal Wave" → ABSTRACT
     - "Modern Art Piece" → MODERNART

4. **Sequence Number (3 digits)**
   - Sequential numbering starting from 001
   - Automatically queries database for existing products
   - Increments from the highest existing sequence
   - No timestamps or random numbers used
   - Ensures proper sequential tracking
   - Range: 001-999

## 📦 Material Variant SKUs

For products with multiple materials, each variant gets a unique SKU suffix:

### Format
```
{BASE_SKU}-{MATERIAL_SUFFIX}
```

### Material Suffixes
| Material  | Suffix | Example SKU              |
|-----------|--------|--------------------------|
| Acrylic   | ACR    | WD-WALL-GEOLION-001-ACR  |
| Steel     | STL    | WD-WALL-GEOLION-001-STL  |
| Iron      | IRN    | WD-WALL-GEOLION-001-IRN  |
| Wood      | WD     | WD-WALL-GEOLION-001-WD   |
| Brass     | BRS    | WD-WALL-GEOLION-001-BRS  |
| Copper    | CPR    | WD-WALL-GEOLION-001-CPR  |
| Aluminum  | ALU    | WD-WALL-GEOLION-001-ALU  |
| Glass     | GLS    | WD-WALL-GEOLION-001-GLS  |
| Ceramic   | CER    | WD-WALL-GEOLION-001-CER  |

## 💡 Real-World Examples

### Example 1: First Wall Art Product
**Product:** "Geometric Lion Head"  
**Category:** Wall Art  
**Materials:** Acrylic, Steel, Wood

**Generated SKUs:**
```
Base Product: WD-WALL-GEOLION-001 (First product, sequence starts at 001)
├─ Acrylic variant: WD-WALL-GEOLION-001-ACR
├─ Steel variant: WD-WALL-GEOLION-001-STL
└─ Wood variant: WD-WALL-GEOLION-001-WD
```

### Example 2: Second Similar Product
**Product:** "Geometric Lion Head v2"  
**Category:** Wall Art  
**Materials:** Brass

**Generated SKUs:**
```
Base Product: WD-WALL-GEOLIONV-002 (System finds existing "GEOLION" and increments to 002)
└─ Brass variant: WD-WALL-GEOLIONV-002-BRS
```

### Example 3: No Category Product
**Product:** "Modern Abstract Sculpture"  
**Category:** None  
**Materials:** Brass, Copper

**Generated SKUs:**
```
Base Product: WD-GEN-MODERNAB-001 (First product in this series)
├─ Brass variant: WD-GEN-MODERNAB-001-BRS
└─ Copper variant: WD-GEN-MODERNAB-001-CPR
```

### Example 4: Sculpture Category
**Product:** "Zen Buddha Statue"  
**Category:** Sculptures  
**Materials:** Ceramic

**Generated SKUs:**
```
Base Product: WD-SCUL-ZENBUDDH-001 (First sculpture product)
└─ Ceramic variant: WD-SCUL-ZENBUDDH-001-CER
```

## 🎯 Benefits of This System

### 1. **Human-Readable**
- Easy to remember and communicate
- Staff can identify products without looking up database
- Example: "WD-WALL-GEOLION" clearly indicates a wall art piece

### 2. **Category Grouping**
- All wall art products start with `WD-WALL-*`
- Easy filtering and inventory reports
- Warehouse organization made simple

### 3. **Unique Identification**
- No duplicate SKUs possible
- Each product + material combination has unique identifier
- Prevents order fulfillment errors

### 4. **Material Variant Tracking**
- Clear distinction between material variants
- Accurate inventory management per material
- Correct pricing for each variant

### 5. **Scalable**
- System handles unlimited products
- New categories automatically supported
- New materials easily added

### 6. **Professional**
- Industry-standard format
- Compatible with barcode systems
- Integration-ready for marketplaces (Amazon, Etsy, etc.)

## 🔄 Auto-Generation Features

### 1. **Automatic Generation**
- SKU auto-generates when product name is entered
- No manual input required
- Saves time and reduces errors

### 2. **Manual Regeneration**
- Click refresh button to generate new SKU
- Useful if you don't like the generated code
- Toast notification confirms regeneration

### 3. **Real-Time Preview**
- See material variant SKUs before saving
- Preview updates as you select materials
- Catch any issues before product creation

### 4. **Database-Backed Sequential Numbering**
- Queries database for existing products
- Finds highest sequence automatically
- Increments by 1 for next product
- No gaps in sequence numbers
- Works across all admin users simultaneously

## 📊 Database Storage

### Base SKU Storage
```sql
products table:
  - sku: "WD-WALL-GEOLION-123" (Base product SKU)
```

### Material Variant Tracking
```sql
product_materials table:
  - product_id: UUID link to product
  - material_id: UUID link to material
  - price: Material-specific price
  - inventory_quantity: Stock for this variant
  
Full variant SKU = product.sku + "-" + material_suffix
Example: "WD-WALL-GEOLION-123-ACR"
```

## 🛠️ Technical Implementation

### SKU Generation Function
Located in: `src/components/admin/create-product-dialog.tsx`

```typescript
async generateAndSetSKU(productName: string) {
  1. Extract category code (3-4 letters) or use "GEN"
  2. Extract product code (8 letters from name)
  3. Query database for existing products with similar SKU pattern
  4. Find highest sequence number from existing SKUs
  5. Increment sequence by 1 (or start at 001 if none exist)
  6. Combine: WD-CATEGORY-PRODUCT-SEQUENCE
}
```

### Sequential Logic
```typescript
// Example database query
const skuPattern = `WD-WALL-GEOLION-%`;
const existingProducts = await query("products")
  .select("sku")
  .like("sku", skuPattern)
  .order("sku", desc)
  .limit(1);

// If last SKU was WD-WALL-GEOLION-003
// Next SKU will be WD-WALL-GEOLION-004
```

### Material Suffix Function
```typescript
getMaterialSuffix(materialName: string) {
  1. Check predefined material mappings
  2. Return 3-letter suffix
  3. Fallback: Use first 3 letters of material name
}
```

## 🔒 Sequential Numbering & Conflict Prevention

### How It Works
1. **Product Name Entered**: "Geometric Lion Head"
2. **System Generates Pattern**: `WD-WALL-GEOLION-%`
3. **Database Query**: Find all SKUs matching pattern
4. **Find Highest**: `WD-WALL-GEOLION-003` (last created)
5. **Increment**: Next SKU becomes `WD-WALL-GEOLION-004`
6. **First Product**: If no matches found, start at `001`

### Conflict Prevention
```
Scenario: Two admins create products simultaneously

Admin A (10:00:00 AM):
  - Creates "Geometric Lion Head"
  - Queries DB: finds WD-WALL-GEOLION-001
  - Generates: WD-WALL-GEOLION-002
  - Saves to database

Admin B (10:00:01 AM):
  - Creates "Geometric Lion Head v2"  
  - Queries DB: finds WD-WALL-GEOLION-002 (just saved)
  - Generates: WD-WALL-GEOLIONV-003
  - Saves to database

Result: No conflicts, sequential numbering maintained ✓
```

### Fallback Mechanism
If database query fails (network issue, etc.):
- System uses a random number between 1-100
- Console warning logged
- Product still created successfully
- Manual SKU correction possible if needed

## 📈 Usage in Operations

### Inventory Management
```
Low Stock Alert for: WD-WALL-GEOLION-001-STL
→ Steel variant of Geometric Lion Head is running low
```

### Order Processing
```
Order #5432
  - SKU: WD-WALL-GEOLION-001-ACR
  - Warehouse staff knows exactly:
    ✓ Category: Wall Art
    ✓ Product: Geometric Lion Head (sequence 001)
    ✓ Material: Acrylic
    ✓ Location: Wall Art section
```

### Sales Reports
```
Top Selling Products in Wall Art (WD-WALL-*):
  1. WD-WALL-GEOLION-001 (all materials: 150 units)
     - Acrylic (WD-WALL-GEOLION-001-ACR): 80 units
     - Steel (WD-WALL-GEOLION-001-STL): 45 units
     - Wood (WD-WALL-GEOLION-001-WD): 25 units
  2. WD-WALL-GEOLION-002 (v2 edition: 75 units)
  3. WD-WALL-ABSTRACT-001 (Abstract wall art: 60 units)
```

## 🚀 Future Enhancements

### Potential Additions:
1. **Size Variants**: `WD-WALL-GEOLION-123-ACR-LG` (Large)
2. **Color Variants**: `WD-WALL-GEOLION-123-ACR-BLK` (Black)
3. **Year Suffix**: `WD-WALL-GEOLION-123-2025` (Collection year)
4. **Custom Codes**: Admin can override auto-generated SKUs

## ❓ FAQ

**Q: Can I change the SKU after creation?**  
A: Yes, but not recommended once orders exist. Update in database carefully.

**Q: What if two products have similar names?**  
A: The system automatically increments the sequence number. For example:
- "Geometric Lion Head" → WD-WALL-GEOLION-001
- "Geometric Lion Head v2" → WD-WALL-GEOLIONV-002
- "Geometric Lion Head Large" → WD-WALL-GEOLIONL-003

**Q: How do I handle seasonal collections?**  
A: Use categories for collections (e.g., "SUMR" for Summer collection).

**Q: Can I use this for physical stores?**  
A: Yes! Convert SKUs to barcodes for POS systems.

**Q: What about international markets?**  
A: SKU structure works globally. Add market prefix if needed (e.g., `WD-US-*`).

## 📞 Support

For questions or issues with the SKU system, refer to:
- Database Schema: `supabase/DATABASE_SCHEMA.md`
- Product Creation: `src/components/admin/create-product-dialog.tsx`
- Material Setup: Admin Dashboard → Materials

---

**Last Updated:** November 2025  
**Version:** 1.0  
**System:** WallDecorator E-Commerce Platform

