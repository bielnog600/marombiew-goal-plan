export type Transformation = {
  id: string;
  name: string;
  before: string;
  after: string;
};

/**
 * Configure as imagens reais assim que forem adicionadas ao projeto.
 * Exemplo: import profile from "@/assets/fabiel.png";
 * e import beforeAluno01 from "@/assets/aluno-01-antes.webp".
 */
export const heroProfileImage: string | undefined = undefined;

export const transformations: Transformation[] = [];
