export type CompanySetup = {
  id: string;
  companyName: string;
  industry: string;
  companySize: string;
  country: string;
  logo: File | null;
  brandColor: string;
};

export type WorkspaceSetupData = {
  workspaceName: string;
  companies: CompanySetup[];
};