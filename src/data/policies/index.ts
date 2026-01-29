import { PolicyData } from '../../types';
import { nivaBupaPolicy } from './nivaBupa';
import { adityaBirlaPolicy } from './adityaBirla';

export const getPolicyData = (policyName: string): PolicyData | null => {
  const normalizedName = policyName.trim().toLowerCase();
  
  if (normalizedName === 'niva bupa' || normalizedName === 'nivabupa') {
    return nivaBupaPolicy;
  }
  
  if (normalizedName === 'aditya birla health insurance' || normalizedName === 'adityabirla') {
    return adityaBirlaPolicy;
  }
  
  return null;
};

export { nivaBupaPolicy, adityaBirlaPolicy };
