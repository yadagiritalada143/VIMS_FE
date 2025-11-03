export interface ProgramConfig {
  module_configs: Array<ProgramConfigModule>;
  program_id:string;
  is_enabled:boolean;
  created_on: Date;
  modified_on: Date;
  created_by: string;
  modified_by:string;
}

export interface ProgramConfigModule {
  module: {
    module: string;
    module_slug: string;
    sub_module: string;
    sub_module_slug: string;
  };
  is_enabled:boolean;
  created_on: Date;
  modified_on: Date;
  created_by: string;
  modified_by:string;
}