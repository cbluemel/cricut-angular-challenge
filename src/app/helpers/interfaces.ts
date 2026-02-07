interface IBark {
  id: string;
  type: string;
}

export interface IFact extends IBark {
  attributes: {
    body: string;
  };
}

export interface IGroup extends IBark {
  attributes: {
    name: string;
  };
  relationships: IGroupRelationship;
}

interface IGroupRelationship {
  breeds: {
    data: IBark[];
  };
}

export interface IBreed extends IBark {
  attributes: IBreedAttributes;
}

interface IBreedAttributes {
  name: string;
  description: string;
  hypoallergenic: boolean;
  life: IMinMax;
  male_weight: IMinMax;
  female_weight: IMinMax;
}

interface IMinMax {
  min: number;
  max: number;
}

export interface IProgress {
  done: number;
  total: number;
}
