import { ReactElement, Ref } from "react";
import { SpectrumSearchFieldProps } from "@react-types/searchfield";
import { TextFieldRef } from "@react-types/textfield";
/**
 * A SearchField is a text field designed for searches.
 */
export const SearchField: (props: SpectrumSearchFieldProps & {
    ref?: Ref<TextFieldRef>;
}) => ReactElement;
export type { SpectrumSearchFieldProps } from '@react-types/searchfield';

//# sourceMappingURL=types.d.ts.map
