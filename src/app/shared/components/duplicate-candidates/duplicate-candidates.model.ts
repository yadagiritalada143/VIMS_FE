export interface Address {
  type: string;
  street_1: string;
  street_2: string;
  city: string;
  state_id: string;
  state: string;
  zipcode: string;
  country: string;
  county: string;
}
export interface Industry {
  id: string;
  name: string;
  is_enabled: boolean;
  created_on: number;
  modified_on: number;
}
export interface Vendor {
  id: string;
  name: string;
  category: string;
  logo_url: string;
  created_on: number;
  modified_on: number;
  trace_id: string;
  industries: Industry[];
}

export interface Candidate {
  id?: string;
  ref_id: number;
  linked_cred_program_id: string;
  linked_cred_candidate_id: string;
  name_prefix: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  name_suffix: string;
  name_initials: string;
  email: string;
  email_secondary: string;
  phone_isdcode_secondary: string;
  phone_number_secondary: string;
  dob: string;
  phone_isdcode: string;
  phone_number: string;
  unique_id: string;
  is_enabled: boolean;
  address: Address[];
  vendor: Vendor;
}

export interface MatchResult {
  value: any;
  is_matched: boolean;
}

export interface DuplicateProfile {
  basic_info: Candidate;
  candidate: string;
  dob: MatchResult;
  email: MatchResult;
  first_name: MatchResult;
  last_name: MatchResult;
  middle_name: MatchResult;
  phone_number: MatchResult;
  match_count: number;
  match_rank: number;
}
