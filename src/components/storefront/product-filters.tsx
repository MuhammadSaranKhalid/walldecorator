"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface ProductFiltersProps {
  onFiltersChange?: (filters: {
    materials: string[];
    priceRange: [number, number];
  }) => void;
}

export function ProductFilters({ onFiltersChange }: ProductFiltersProps) {
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([50, 500]);

  const materials = ["Acrylic", "Steel", "Iron", "Wood"];

  const handleMaterialToggle = (material: string) => {
    const newMaterials = selectedMaterials.includes(material)
      ? selectedMaterials.filter((m) => m !== material)
      : [...selectedMaterials, material];
    
    setSelectedMaterials(newMaterials);
    onFiltersChange?.({ materials: newMaterials, priceRange });
  };

  const handlePriceChange = (value: number[]) => {
    const newRange: [number, number] = [value[0], value[1]];
    setPriceRange(newRange);
    onFiltersChange?.({ materials: selectedMaterials, priceRange: newRange });
  };

  const handleClearAll = () => {
    setSelectedMaterials([]);
    setPriceRange([50, 500]);
    onFiltersChange?.({ materials: [], priceRange: [50, 500] });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Filters</h3>
      
      {/* Material Filter */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Material</h4>
        <div className="space-y-2">
          {materials.map((material) => (
            <label key={material} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 rounded text-primary focus:ring-primary/50"
                checked={selectedMaterials.includes(material)}
                onChange={() => handleMaterialToggle(material)}
              />
              <span className="text-sm">{material}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Price Range</h4>
        <div className="pt-2">
          <Slider
            value={[priceRange[0], priceRange[1]]}
            onValueChange={handlePriceChange}
            min={50}
            max={500}
            step={10}
            className="w-full"
          />
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-4">
        <Button className="w-full font-bold">Apply Filters</Button>
        <Button
          variant="secondary"
          className="w-full font-bold"
          onClick={handleClearAll}
        >
          Clear All
        </Button>
      </div>
    </div>
  );
}

