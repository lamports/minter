export interface MetadataJSON {
  name: string;
  symbol: string;
  description: string;
  seller_fee_basis_points: number;
  image: string;
  external_url: string;
  attributes: Attribute[];
  properties: Property;
  collection: Collection;
}

export interface Attribute {
  trait_type: string;
  value: string;
}

export interface Property {
  files: MetaFile[];
  category: string;
  creators: Creator[];
}

export interface MetaFile {
  uri: string;
  type: string;
}

export interface Creator {
  address: string;
  share: number;
}

export interface Collection {
  name: string;
  family: string;
}
