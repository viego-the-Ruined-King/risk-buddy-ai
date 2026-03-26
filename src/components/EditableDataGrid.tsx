import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Lock, Unlock } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface Column {
  key: string;
  label: string;
  width?: string;
  render?: (value: any, row: any, rowIndex: number) => React.ReactNode;
  editable?: boolean;
  type?: "text" | "select" | "badge";
  options?: string[];
  className?: string;
  headerClassName?: string;
  colSpan?: number;
  rowSpan?: number;
}

interface HeaderGroup {
  label: string;
  colSpan: number;
  className?: string;
}

interface EditableDataGridProps<T extends Record<string, any>> {
  data: T[];
  columns: Column[];
  headerGroups?: HeaderGroup[];
  subHeaders?: Column[];
  onDataChange: (data: T[]) => void;
  onAddRow?: () => T;
  isLocked: boolean;
  onToggleLock: () => void;
  rowClassName?: (row: T, index: number) => string;
  mobileCardRender?: (row: T, index: number, isLocked: boolean, onCellEdit: (rowIndex: number, key: string, value: any) => void) => React.ReactNode;
}

function EditableDataGrid<T extends Record<string, any>>({
  data,
  columns,
  headerGroups,
  subHeaders,
  onDataChange,
  onAddRow,
  isLocked,
  onToggleLock,
  rowClassName,
  mobileCardRender,
}: EditableDataGridProps<T>) {
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const handleDoubleClick = useCallback(
    (rowIndex: number, colKey: string, currentValue: any) => {
      if (isLocked) return;
      const col = columns.find((c) => c.key === colKey) || subHeaders?.find((c) => c.key === colKey);
      if (col?.editable === false) return;
      setEditingCell({ row: rowIndex, col: colKey });
      const val = Array.isArray(currentValue) ? currentValue.join("\n") : String(currentValue ?? "");
      setEditValue(val);
    },
    [isLocked, columns, subHeaders]
  );

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const { row, col } = editingCell;
    const newData = [...data];
    const original = newData[row][col];

    if (Array.isArray(original)) {
      newData[row] = { ...newData[row], [col]: editValue.split("\n").filter(Boolean) };
    } else {
      newData[row] = { ...newData[row], [col]: editValue };
    }

    onDataChange(newData);
    setEditingCell(null);
  }, [editingCell, editValue, data, onDataChange]);

  const handleCellEdit = useCallback(
    (rowIndex: number, key: string, value: any) => {
      if (isLocked) return;
      const newData = [...data];
      newData[rowIndex] = { ...newData[rowIndex], [key]: value };
      onDataChange(newData);
    },
    [isLocked, data, onDataChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditingCell(null);
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        commitEdit();
      }
    },
    [commitEdit]
  );

  const handleAddRow = () => {
    if (isLocked || !onAddRow) return;
    const newRow = onAddRow();
    onDataChange([...data, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    if (isLocked) return;
    onDataChange(data.filter((_, i) => i !== index));
  };

  const renderCell = (row: T, rowIndex: number, col: Column) => {
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === col.key;
    const value = row[col.key];

    if (col.render && !isEditing) {
      return col.render(value, row, rowIndex);
    }

    if (isEditing) {
      const isMultiline = Array.isArray(value) || (typeof value === "string" && value.length > 50);
      return isMultiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[60px] p-1 text-xs bg-background border border-primary rounded resize-y focus:outline-none focus:ring-1 focus:ring-primary"
          rows={3}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="w-full p-1 text-xs bg-background border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
        />
      );
    }

    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside space-y-0.5">
          {value.map((item, i) => (
            <li key={i} className="text-[10px] whitespace-normal break-words">
              {item}
            </li>
          ))}
        </ul>
      );
    }

    return <span className="text-[10px] whitespace-normal break-words">{value ?? "-"}</span>;
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {!isLocked && onAddRow && (
          <Button type="button" variant="outline" size="sm" onClick={handleAddRow} className="text-xs h-8">
            <Plus className="h-3 w-3 mr-1" />
            Add Row
          </Button>
        )}
        <Button
          type="button"
          variant={isLocked ? "default" : "outline"}
          size="sm"
          onClick={onToggleLock}
          className="text-xs h-8"
        >
          {isLocked ? (
            <>
              <Lock className="h-3 w-3 mr-1" />
              Study Locked — Click to Unlock
            </>
          ) : (
            <>
              <Unlock className="h-3 w-3 mr-1" />
              Approve & Lock Study
            </>
          )}
        </Button>
        {!isLocked && (
          <span className="text-[10px] text-muted-foreground italic">
            Double-click any cell to edit inline
          </span>
        )}
      </div>

      {/* Mobile Card View */}
      {mobileCardRender && (
        <div className="block lg:hidden space-y-3">
          {data.map((row, index) => (
            <div key={index} className="relative">
              {mobileCardRender(row, index, isLocked, handleCellEdit)}
              {!isLocked && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRow(index)}
                  className="absolute top-2 right-2 h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Desktop Table */}
      <div className={`${mobileCardRender ? "hidden lg:block" : "block"} overflow-x-auto max-w-full rounded-lg border border-border/50`}>
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-card z-10">
              {headerGroups && (
                <tr className="bg-primary/10 border-b border-primary/20">
                  {headerGroups.map((group, i) => (
                    <th
                      key={i}
                      colSpan={group.colSpan}
                      className={`border border-border/50 px-2 py-1 text-xs font-bold text-center text-foreground ${group.className || ""}`}
                    >
                      {group.label}
                    </th>
                  ))}
                  {!isLocked && <th rowSpan={subHeaders ? 2 : 1} className="border border-border/50 px-1 py-1 text-xs font-bold text-center w-8"></th>}
                </tr>
              )}
              {subHeaders ? (
                <tr className="bg-primary/5 border-b border-primary/20">
                  {subHeaders.map((col) => (
                    <th
                      key={col.key}
                      className={`border border-border/50 px-1 py-1 text-[10px] font-bold text-center ${col.headerClassName || ""}`}
                      style={{ width: col.width }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              ) : !headerGroups ? (
                <tr className="bg-primary/10 border-b border-primary/20">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`border border-border/50 px-2 py-2 text-xs font-bold text-foreground whitespace-nowrap ${col.headerClassName || ""}`}
                      style={{ width: col.width }}
                      colSpan={col.colSpan}
                      rowSpan={col.rowSpan}
                    >
                      {col.label}
                    </th>
                  ))}
                  {!isLocked && <th className="border border-border/50 px-1 py-1 text-xs font-bold text-center w-8"></th>}
                </tr>
              ) : null}
            </thead>
            <tbody>
              {data.map((row, rowIndex) => {
                const allCols = subHeaders || columns;
                return (
                  <motion.tr
                    key={rowIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: rowIndex * 0.02 }}
                    className={`border-b border-border/50 hover:bg-primary/5 transition-colors ${
                      rowClassName ? rowClassName(row, rowIndex) : ""
                    } ${!isLocked ? "cursor-pointer" : ""}`}
                  >
                    {allCols.map((col) => (
                      <td
                        key={col.key}
                        className={`border border-border/50 px-2 py-1.5 ${col.className || ""} ${
                          !isLocked && col.editable !== false ? "hover:bg-primary/10" : ""
                        }`}
                        onDoubleClick={() => handleDoubleClick(rowIndex, col.key, row[col.key])}
                        style={{ width: col.width }}
                      >
                        {renderCell(row, rowIndex, col)}
                      </td>
                    ))}
                    {!isLocked && (
                      <td className="border border-border/50 px-1 py-1 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRow(rowIndex)}
                          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    )}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default EditableDataGrid;
