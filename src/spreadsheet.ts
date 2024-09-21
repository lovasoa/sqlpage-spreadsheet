import "@univerjs/design/lib/index.css";
import "@univerjs/ui/lib/index.css";
import "@univerjs/docs-ui/lib/index.css";
import "@univerjs/sheets-ui/lib/index.css";
import "@univerjs/sheets-formula/lib/index.css";

import {
  type CellValue,
  CellValueType,
  type ICellData,
  type IObjectMatrixPrimitiveType,
  type IStyleData,
  type IWorkbookData,
  type IWorksheetData,
  LocaleType,
  Univer,
  UniverInstanceType,
  type Workbook,
  type Worksheet,
} from "@univerjs/core";
import { defaultTheme } from "@univerjs/design";

import { UniverFormulaEnginePlugin } from "@univerjs/engine-formula";
import { UniverRenderEnginePlugin } from "@univerjs/engine-render";

import { UniverUIPlugin } from "@univerjs/ui";

import { UniverDocsPlugin } from "@univerjs/docs";
import { UniverDocsUIPlugin } from "@univerjs/docs-ui";
import { FUniver } from "@univerjs/facade";
import {
  type ISetRangeValuesMutationParams,
  SetRangeValuesMutation,
  UniverSheetsPlugin,
} from "@univerjs/sheets";
import { UniverSheetsFormulaPlugin } from "@univerjs/sheets-formula";
import { UniverSheetsNumfmtPlugin } from "@univerjs/sheets-numfmt";
import { UniverSheetsUIPlugin } from "@univerjs/sheets-ui";

import { z } from "zod";

const PropsSchema = z.object({
  update_link: z.string().url(),
  freeze_x: z.number().int().nonnegative(),
  freeze_y: z.number().int().nonnegative(),
  component_index: z.number().int().nonnegative(),
});

type Props = z.infer<typeof PropsSchema>;

function setupUniver(component_index: number) {
  const univer = new Univer({
    theme: defaultTheme,
    locale: LocaleType.EN_US,
    locales: {
      [LocaleType.EN_US]: {},
    },
  });

  univer.registerPlugin(UniverRenderEnginePlugin);
  univer.registerPlugin(UniverFormulaEnginePlugin);
  univer.registerPlugin(UniverUIPlugin, {
    container: `_sqlpage_spreadsheet_univer_${component_index}`,
  });
  univer.registerPlugin(UniverDocsPlugin, { hasScroll: false });
  univer.registerPlugin(UniverDocsUIPlugin);
  univer.registerPlugin(UniverSheetsPlugin);
  univer.registerPlugin(UniverSheetsUIPlugin);
  univer.registerPlugin(UniverSheetsNumfmtPlugin);
  univer.registerPlugin(UniverSheetsFormulaPlugin);
  return univer;
}

function setupErrorModal(component_index: number) {
  const resp_modal = document.getElementById(`errorModal_${component_index}`);
  if (!resp_modal) throw new Error(`errorModal_${component_index} not found`);
  const resp_modal_body = resp_modal.querySelector(".modal-body");
  if (!resp_modal_body)
    throw new Error(`errorModal_${component_index} not found`);
  // @ts-ignore : bootstrap is included separately by sqlpage, and available globally
  const Modal = window?.bootstrap?.Modal;
  if (!Modal) throw new Error("bootstrap.Modal not found");
  return { resp_modal, resp_modal_body, Modal };
}

async function handleUpdate(
  update_link: string,
  x: number,
  y: number,
  value: CellValue | null,
  custom: Record<string, unknown>,
  errorModal: ReturnType<typeof setupErrorModal>,
) {
  if (!update_link) return;

  const url = new URL(update_link, window.location.href);
  url.searchParams.append("_sqlpage_embed", "");
  const formData = new URLSearchParams();
  formData.append("x", x.toString());
  formData.append("y", y.toString());
  if (value != null)
    formData.append("value", value == null ? "" : value.toString());
  if (typeof custom.id === "string") formData.append("id", custom.id);
  const r = await fetch(url, { method: "POST", body: formData });
  let resp_html = await r.text();
  if (r.status !== 200 && !resp_html) resp_html = r.statusText;
  if (resp_html) {
    errorModal.resp_modal_body.innerHTML = resp_html;
    new errorModal.Modal(errorModal.resp_modal).show();
  }
}

const CellPropsSchema = z.union([z.string(), z.number()]);

const DataArraySchema = z
  .tuple([
    z
      .number()
      .int()
      .nonnegative(), // colIdx
    z
      .number()
      .int()
      .nonnegative(), // rowIdx
    z.union([z.string(), z.number(), z.null()]), // value
  ])
  .rest(CellPropsSchema); // props

type CellProps = z.infer<typeof CellPropsSchema>;

function cellFromProps(props: CellProps[]) {
  const s: Partial<IStyleData & { id: string }> = {};
  for (let i = 0; i < props.length; i++) {
    const n = props[i];
    if (n === 1) s.bl = 1;
    else if (n === 2) s.it = 1;
    else if (n === 3) {
      const color = props[++i];
      s.bg = {
        rgb: getComputedStyle(document.documentElement).getPropertyValue(
          `--tblr-${color}`,
        ),
      };
    } else if (n === 4) s.ht = 2;
    else if (n === 5) s.ht = 3;
    else if (n === 6) {
      const pattern = props[++i].toString();
      s.n = { pattern };
    } else if (n === 7) s.id = props[++i].toString();
  }
  return s;
}

function generateWorkSheet(dataArray: any[]): Partial<IWorksheetData> {
  const cellData: IObjectMatrixPrimitiveType<ICellData> = {};
  let rowCount = 1000;
  let columnCount = 26;

  for (const elem of dataArray) {
    const [colIdx, rowIdx, value, ...props] = DataArraySchema.parse(elem);
    const cell: Partial<ICellData> = { v: value };
    const style = props.length ? cellFromProps(props) : null;
    cell.s = style;
    if (style?.id) cell.custom = { id: style.id };
    if (typeof value === "number") cell.t = CellValueType.NUMBER;
    const row = cellData[rowIdx];
    if (row) row[colIdx] = cell;
    else cellData[rowIdx] = { [colIdx]: cell };
    rowCount = Math.max(rowCount, rowIdx);
    columnCount = Math.max(columnCount, colIdx);
  }

  return {
    id: "sqlpage",
    name: "SQLPage Data",
    rowCount,
    columnCount,
    cellData,
  };
}

function createWorkbook(univer: Univer, data: any[]): Workbook {
  return univer.createUnit<IWorkbookData, Workbook>(
    UniverInstanceType.UNIVER_SHEET,
    {
      sheetOrder: ["sqlpage"],
      name: "sqlpage",
      appVersion: "0.2.14",
      locale: LocaleType.EN_US,
      sheets: {
        sqlpage: generateWorkSheet(data),
      },
    },
  );
}

function setFrozenCells(
  univerAPI: FUniver,
  activeSheet: Worksheet,
  freeze_x: number,
  freeze_y: number,
) {
  if (freeze_x || freeze_y) {
    univerAPI.executeCommand("sheet.mutation.set-frozen", {
      unitId: activeSheet.getUnitId(),
      subUnitId: activeSheet.getSheetId(),
      startRow: freeze_y,
      startColumn: freeze_x,
      xSplit: freeze_x,
      ySplit: freeze_y,
    });
  }
}

async function renderSpreadsheet(props: Props, data: any[]) {
  const { update_link, freeze_x, freeze_y, component_index } = props;
  const errorModal = setupErrorModal(component_index);
  const univer = setupUniver(component_index);
  const univerAPI = FUniver.newAPI(univer);
  const workbook = createWorkbook(univer, data);
  const activeSheet = workbook.getActiveSheet();

  setFrozenCells(univerAPI, activeSheet, freeze_x, freeze_y);

  univerAPI.onCommandExecuted(({ id, params }) => {
    console.log(id, params);
    if (id === SetRangeValuesMutation.id) {
      const { cellValue } = params as ISetRangeValuesMutationParams;
      if (!cellValue) return;
      for (const row in cellValue) {
        const cols = cellValue[row];
        for (const col in cols) {
          const cell = cols[col];
          if (!cell) continue;
          type V = Exclude<typeof cell.v, void>;
          handleUpdate(
            update_link,
            Number.parseInt(col),
            Number.parseInt(row),
            cell.v as V,
            cell.custom || {},
            errorModal,
          );
        }
      }
    }
  });
}

const rawProps = JSON.parse(
  document?.currentScript?.dataset?.template_props || "{}",
);

try {
  const validatedProps = PropsSchema.parse(rawProps.props);
  const data = z.any().array().parse(rawProps.data); // will be fully validated later
  renderSpreadsheet(validatedProps, data);
} catch (error) {
  alert(`Invalid properties passed to the spreadsheet component: ${error}`);
}
