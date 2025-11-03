export class UpdateLinkMasterProfilePayload{
  program_id: string;
  mtp_id?: string;
}

export class MasterTalentProfileDetailsRequestParam {
  programId: string;
  mtpId: string;
}
export class WorkerCandidateDetailsParam {
  programId: string;
  candidateId: string;
}

export class MasterTalentProfileUpdatePayload {
  talent_name: string;
}
export class MasterTalentProfileListRequestParam {
  programId: string;
  page: number;
  unique_id: string;
  talent_name: string;
  modified_on: Array<any>;
  linked_profiles: number;
  assignment_count:number;
  jobs_count:number;
  do_not_rehire:boolean; 
  limit: number;
}


