export type CompanySetup = {
  id: string;
  companyName: string;
  industryCodes: string[];
  companySize: string;
  country: string;
  logo: File | null;
  companyCode: string;
  brandColor: string;
};

export type WorkspaceSetupData = {
  workspaceName: string;
  companies: CompanySetup[];
};
