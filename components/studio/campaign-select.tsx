"use client";

import { Select } from "@/components/ui";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export function CampaignSelect({ value, onChange }: Props) {
  return (
    <Select
      label="Campaign profile"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="nate_landing">nate_landing</option>
      <option value="corporate">corporate</option>
    </Select>
  );
}
