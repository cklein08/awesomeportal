import "./table.11fc8462.css";
import $khOO8$table_cssmodulejs from "./table_css.mjs";
import {useTableContext as $bd013581c0a4b065$export$3cb274deb6c2d854} from "./TableViewBase.mjs";
import {classNames as $khOO8$classNames} from "@react-spectrum/utils";
import $khOO8$react, {useRef as $khOO8$useRef} from "react";
import {useVisuallyHidden as $khOO8$useVisuallyHidden} from "@react-aria/visually-hidden";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 




function $7ee9a922ee4e8032$export$2c0bab5914a9d088(props) {
    var _rowProps_style, _rowProps_style1, _rowProps_style2;
    let { dropState: dropState, dragAndDropHooks: dragAndDropHooks } = (0, $bd013581c0a4b065$export$3cb274deb6c2d854)();
    const { target: target, rowProps: rowProps } = props;
    let ref = (0, $khOO8$useRef)(null);
    let { dropIndicatorProps: dropIndicatorProps } = dragAndDropHooks.useDropIndicator(props, dropState, ref);
    let { visuallyHiddenProps: visuallyHiddenProps } = (0, $khOO8$useVisuallyHidden)();
    let isDropTarget = dropState.isDropTarget(target);
    if (!isDropTarget && dropIndicatorProps['aria-hidden']) return null;
    return /*#__PURE__*/ (0, $khOO8$react).createElement("div", {
        style: {
            position: 'absolute',
            top: typeof ((_rowProps_style = rowProps.style) === null || _rowProps_style === void 0 ? void 0 : _rowProps_style.top) === 'number' && typeof ((_rowProps_style1 = rowProps.style) === null || _rowProps_style1 === void 0 ? void 0 : _rowProps_style1.height) === 'number' ? rowProps.style.top + (target.dropPosition === 'after' ? rowProps.style.height : 0) : 0,
            width: (_rowProps_style2 = rowProps.style) === null || _rowProps_style2 === void 0 ? void 0 : _rowProps_style2.width
        },
        role: "row",
        "aria-hidden": dropIndicatorProps['aria-hidden']
    }, /*#__PURE__*/ (0, $khOO8$react).createElement("div", {
        role: "gridcell",
        className: (0, $khOO8$classNames)((0, ($parcel$interopDefault($khOO8$table_cssmodulejs))), 'react-spectrum-Table-InsertionIndicator', {
            'react-spectrum-Table-InsertionIndicator--dropTarget': isDropTarget
        })
    }, /*#__PURE__*/ (0, $khOO8$react).createElement("div", {
        ...visuallyHiddenProps,
        role: "button",
        ...dropIndicatorProps,
        ref: ref
    })));
}


export {$7ee9a922ee4e8032$export$2c0bab5914a9d088 as InsertionIndicator};
//# sourceMappingURL=InsertionIndicator.module.js.map
