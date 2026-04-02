import { useState, useEffect } from "react";

export function useCreateGroupForm() {
  const [formData, setFormData] = useState({
    name: "",
    buy_in: 10,
    max_participants: 10,
    required_picks: 6,
    visibility: "public",
    password: "",
    confirmPassword: "",
    description: "",
  });

  const [payoutMode, setPayoutMode] = useState("preset");
  const [payoutRules, setPayoutRules] = useState({ preset: "top3_50_30_20" });
  const [payoutValid, setPayoutValid] = useState(true);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePayoutChange = (mode, rules) => {
    setPayoutMode(mode);
    setPayoutRules(rules);
  };

  return {
    formData,
    payoutMode,
    payoutRules,
    payoutValid,
    handleInputChange,
    handlePayoutChange,
    setPayoutValid,
  };
}
