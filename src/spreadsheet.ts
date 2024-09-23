import type {
	CellValue,
	CellValueType,
	ICellData,
	IObjectMatrixPrimitiveType,
	IStyleData,
	IWorksheetData,
	UniverInstanceType,
	Workbook,
	Worksheet,
} from "@univerjs/core";
import type { FUniver } from "@univerjs/facade";
import type {
	ISetFrozenMutationParams,
	ISetRangeValuesMutationParams,
} from "@univerjs/sheets";

import "@univerjs/design/lib/index.css";
import "@univerjs/ui/lib/index.css";
import "@univerjs/docs-ui/lib/index.css";
import "@univerjs/sheets-ui/lib/index.css";
import "@univerjs/sheets-formula/lib/index.css";

const univer_core = import("@univerjs/core").then(
	({ Univer, LocaleType, Tools }) => ({ Univer, LocaleType, Tools }),
);
const design = import("@univerjs/design").then(({ defaultTheme }) => ({
	defaultTheme,
}));
const render_engine = import("@univerjs/engine-render").then(
	({ UniverRenderEnginePlugin }) => UniverRenderEnginePlugin,
);
const ui_plugin = import("@univerjs/ui").then(
	({ UniverUIPlugin }) => UniverUIPlugin,
);
const univer_sheets = import("@univerjs/sheets").then(
	({ UniverSheetsPlugin, SetRangeValuesMutation, SetFrozenCommand }) => ({
		UniverSheetsPlugin,
		SetRangeValuesMutation,
		SetFrozenCommand,
	}),
);
const sheets_ui_plugin = import("@univerjs/sheets-ui").then(
	({ UniverSheetsUIPlugin }) => UniverSheetsUIPlugin,
);
const engine_formula = import("@univerjs/engine-formula").then(
	({ UniverFormulaEnginePlugin }) => UniverFormulaEnginePlugin,
);
const sheets_numfmt = import("@univerjs/sheets-numfmt").then(
	({ UniverSheetsNumfmtPlugin }) => UniverSheetsNumfmtPlugin,
);
const sheets_formula = import("@univerjs/sheets-formula").then(
	({ UniverSheetsFormulaPlugin }) => UniverSheetsFormulaPlugin,
);
const facade = import("@univerjs/facade").then(({ FUniver }) => ({ FUniver }));
const zod = import("zod");
const docs_plugin = import("@univerjs/docs").then(
	({ UniverDocsPlugin }) => UniverDocsPlugin,
);
const docs_ui_plugin = import("@univerjs/docs-ui").then(
	({ UniverDocsUIPlugin }) => UniverDocsUIPlugin,
);

const DesignEnUS = import(
	"node_modules/@univerjs/design/lib/locale/en-US.json"
);
const SheetsEnUS = import(
	"node_modules/@univerjs/sheets/lib/locale/en-US.json"
);
const SheetsUIEnUS = import(
	"node_modules/@univerjs/sheets-ui/lib/locale/en-US.json"
);
const SheetsFormulaEnUS = import(
	"node_modules/@univerjs/sheets-formula/lib/locale/en-US.json"
);
const UIEnUS = import("node_modules/@univerjs/ui/lib/locale/en-US.json");
const DocsUIEnUS = import(
	"node_modules/@univerjs/docs-ui/lib/locale/en-US.json"
);

const NUMBER_CELL_TYPE: typeof CellValueType.NUMBER = 2;
const UNIVER_SHEET_TYPE: typeof UniverInstanceType.UNIVER_SHEET = 2;

function generateWorkSheet(dataArray: any[], z: Zod): Partial<IWorksheetData> {
	const cellData: IObjectMatrixPrimitiveType<ICellData> = {};
	let rowCount = 1000;
	let columnCount = 26;
	const schema = DataArraySchema(z);

	for (const elem of dataArray) {
		const [colIdx, rowIdx, value, ...props] = schema.parse(elem);
		const cell: ICellData = { v: value };
		const style = props.length ? cellFromProps(props) : null;
		cell.s = style;
		if (style?.id) cell.custom = { id: style.id };
		if (typeof value === "number") cell.t = NUMBER_CELL_TYPE;
		const row = cellData[rowIdx];
		if (row) row[colIdx] = cell;
		else cellData[rowIdx] = { [colIdx]: cell };
		rowCount = Math.max(rowCount, rowIdx);
		columnCount = Math.max(columnCount, colIdx);
	}

	return {
		id: "sqlpage",
		name: "SQLPage Data",
		rowHeader: { width: 2 },
		rowCount,
		columnCount,
		cellData,
	};
}

async function setupUniver(container: HTMLElement) {
	const { Univer, LocaleType, Tools } = await univer_core;
	const { defaultTheme } = await design;

	const univer = new Univer({
		theme: defaultTheme,
		logLevel: 3,
		locale: LocaleType.EN_US,
		locales: {
			[LocaleType.EN_US]: Tools.deepMerge(
				await DesignEnUS,
				await SheetsEnUS,
				await SheetsUIEnUS,
				await SheetsFormulaEnUS,
				await UIEnUS,
				await DocsUIEnUS,
			),
		},
	});

	univer.registerPlugin(await render_engine);
	const uiPlugin = await ui_plugin;
	container.className = "sqlpage_spreadsheet";
	univer.registerPlugin(uiPlugin, { container });
	univer.registerPlugin((await univer_sheets).UniverSheetsPlugin);
	univer.registerPlugin(await sheets_ui_plugin);
	univer.registerPlugin(await docs_plugin);
	univer.registerPlugin(await docs_ui_plugin);
	univer.registerPlugin(await engine_formula);
	univer.registerPlugin(await sheets_numfmt);
	univer.registerPlugin(await sheets_formula);

	return univer;
}

function setupErrorModal(resp_modal: HTMLElement) {
	if (!resp_modal) throw new Error("errorModal not found");
	const resp_modal_body = resp_modal.querySelector(".modal-body");
	if (!resp_modal_body) throw new Error("errorModal not found");
	// @ts-ignore: bootstrap.is included by sqlpage
	const Modal = window?.bootstrap?.Modal;
	if (!Modal) throw new Error("bootstrap.Modal not found");
	return { resp_modal, resp_modal_body, Modal };
}

async function handleUpdate(
	update_link: string,
	x: number,
	y: number,
	value: CellValue | null | undefined,
	custom: Record<string, unknown>,
	errorModal: ReturnType<typeof setupErrorModal>,
) {
	if (!update_link) return;

	const url = new URL(update_link, window.location.href);
	url.searchParams.append("_sqlpage_embed", "");
	const formData = new URLSearchParams();
	formData.append("x", x.toString());
	formData.append("y", y.toString());
	if (value != null) formData.append("value", value.toString());
	if (typeof custom.id === "string") formData.append("id", custom.id);
	const r = await fetch(url, { method: "POST", body: formData });
	let resp_html = await r.text();
	if (r.status !== 200 && !resp_html) resp_html = r.statusText;
	if (resp_html) {
		errorModal.resp_modal_body.innerHTML = resp_html;
		new errorModal.Modal(errorModal.resp_modal).show();
	}
}

const CSS_VARS = getComputedStyle(document.documentElement);

function cellFromProps(props: CellProps[]) {
	const s: IStyleData & { id?: string } = {};
	for (let i = 0; i < props.length; i++) {
		const n = props[i];
		if (n === 1) s.bl = 1;
		else if (n === 2) s.it = 1;
		else if (n === 3) {
			const color = props[++i].toString();
			const rgb = CSS_VARS.getPropertyValue(`--tblr-${color}`) || color;
			s.bg = { rgb };
		} else if (n === 4) s.ht = 2;
		else if (n === 5) s.ht = 3;
		else if (n === 6) {
			const pattern = props[++i].toString();
			s.n = { pattern };
		} else if (n === 7) s.id = props[++i].toString();
	}
	return s;
}

async function setFrozenCells(
	univerAPI: FUniver,
	activeSheet: Worksheet,
	freeze_x: number,
	freeze_y: number,
) {
	if (!freeze_x && !freeze_y) return;
	const { SetFrozenCommand } = await univer_sheets;
	const params: ISetFrozenMutationParams = {
		unitId: activeSheet.getUnitId(),
		subUnitId: activeSheet.getSheetId(),
		startRow: freeze_y,
		startColumn: freeze_x,
		xSplit: freeze_x,
		ySplit: freeze_y,
	};
	univerAPI.executeCommand(SetFrozenCommand.id, params);
}

async function renderSpreadsheet(
	container: HTMLElement,
	props: Props,
	data: any[],
) {
	const { update_link, freeze_x, freeze_y } = props;
	const modal = container.querySelector(".modal");
	if (!(modal instanceof HTMLElement)) throw new Error("modal not found");
	const errorModal = setupErrorModal(modal);

	const worksheet = generateWorkSheet(data, await zod);

	const univer = await setupUniver(container);

	const workbook: Workbook = univer.createUnit(UNIVER_SHEET_TYPE, {
		sheetOrder: ["sqlpage"],
		name: "sqlpage",
		appVersion: "0.2.14",
		sheets: {
			sqlpage: worksheet,
		},
	});

	const activeSheet = workbook.getActiveSheet();

	const { FUniver } = await facade;

	const univerAPI = FUniver.newAPI(univer);
	setFrozenCells(univerAPI, activeSheet, freeze_x, freeze_y);

	const { SetRangeValuesMutation } = await univer_sheets;
	univerAPI.onCommandExecuted(({ id, params }) => {
		// To debug:
		console.log(id, params);
		if (update_link && id === SetRangeValuesMutation.id) {
			handleSetRangeValues(
				params as ISetRangeValuesMutationParams,
				update_link,
				errorModal,
			);
		}
	});
}

function handleSetRangeValues(
	params: ISetRangeValuesMutationParams,
	update_link: string,
	errorModal: ReturnType<typeof setupErrorModal>,
) {
	const { cellValue } = params;
	if (!cellValue) return;

	for (const row in cellValue) {
		const cols = cellValue[row];
		for (const col in cols) {
			const cell = cols[col];
			if (!cell) continue;
			handleUpdate(
				update_link,
				Number.parseInt(col),
				Number.parseInt(row),
				cell.v as CellValue | null | undefined,
				cell.custom || {},
				errorModal,
			);
		}
	}
}

type Zod = typeof import("zod");

const PropsSchema = (z: Zod) =>
	z.object({
		update_link: z.string().optional(),
		freeze_x: z.number().int().nonnegative().default(0),
		freeze_y: z.number().int().nonnegative().default(0),
	});

type Props = Zod.infer<ReturnType<typeof PropsSchema>>;

const CellPropsSchema = (z: Zod) => z.union([z.string(), z.number()]);

const DataArraySchema = (z: Zod) =>
	z
		.tuple([
			z.number().int().nonnegative(),
			z.number().int().nonnegative(),
			z.union([z.string(), z.number(), z.null()]),
		])
		.rest(CellPropsSchema(z));

type CellProps = Zod.infer<ReturnType<typeof CellPropsSchema>>;

export async function renderSpreadsheetToElement(element: HTMLElement) {
	try {
		const dataset = element.dataset;
		if (!dataset) throw new Error("Props not found");
		const rawCells = JSON.parse(dataset?.cells || "[]");
		if (!Array.isArray(rawCells))
			throw new Error(`Invalid cells${dataset?.cells}`);
		const validatedProps = PropsSchema(await zod).parse(
			JSON.parse(dataset?.props || "{}"),
		);
		renderSpreadsheet(element, validatedProps, rawCells);
	} catch (error) {
		alert(`Invalid properties passed to the spreadsheet component: ${error}`);
	}
}

const elems = document.getElementsByClassName("sqlpage_spreadsheet");
const elem = elems[elems.length - 1];
if (!(elem instanceof HTMLElement))
	throw new Error("No spreadsheet elements found");
renderSpreadsheetToElement(elem);
