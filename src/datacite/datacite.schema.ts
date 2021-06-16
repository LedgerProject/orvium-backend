export class DataciteCreator {
  creatorName!: string;
  givenName!: string;
  familyName!: string;
  nameIdentifiers?: NameIdentifier[];
}

export class NameIdentifier {
  nameIdentifier!: string;
  nameIdentifierScheme!: string;
  schemeURI?: string;
}
