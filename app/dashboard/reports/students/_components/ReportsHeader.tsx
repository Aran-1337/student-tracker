"use client";

import { HiOutlineDocumentReport } from "react-icons/hi";
import { HiOutlineArrowDownTray } from "react-icons/hi2";
import { RiWhatsappLine } from "react-icons/ri";

const arabicMonths = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

interface Props {
  monthIndex: number;
  year: number;
  totalFiltered: number;
  withPhone: number;
  onExportPDF: () => void;
  onSendAll: () => void;
}

export default function ReportsHeader({ monthIndex, year, totalFiltered, withPhone, onExportPDF, onSendAll }: Props) {
  return (
    <div className="sr-header">
      <div className="sr-header-title">
        <div className="sr-header-icon">
          <HiOutlineDocumentReport size={26} />
        </div>
        <div>
          <h1>تقارير الطلاب</h1>
          <p>تقرير الحضور والدفع — شهر {arabicMonths[monthIndex]} {year} · {totalFiltered} طالب</p>
        </div>
      </div>
      <div className="sr-header-actions">
        <button className="sr-btn sr-btn-whatsapp" onClick={onSendAll} disabled={withPhone === 0}>
          <RiWhatsappLine size={18} />
          إرسال للكل ({withPhone})
        </button>
        <button className="sr-btn sr-btn-export" onClick={onExportPDF}>
          <HiOutlineArrowDownTray size={18} />
          تصدير PDF
        </button>
      </div>
    </div>
  );
}
