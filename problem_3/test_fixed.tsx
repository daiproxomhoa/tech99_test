// =====================================================================
// Problem 3 — Messy React: Các vấn đề & Bản refactor
// =====================================================================
//
// CÁC VẤN ĐỀ (anti-pattern + kém hiệu năng trong test.tsx gốc)
// ---------------------------------------------------------------------
//
// 1. BUG — biến `lhsPriority` không tồn tại trong hàm filter (dòng 38).
//    Code dùng `lhsPriority` nhưng chỉ khai báo `balancePriority`.
//    Sẽ throw ReferenceError lúc runtime. Phải sửa thành `balancePriority`.
//
// 2. BUG — logic filter ngược. Đang giữ lại các ví có `amount <= 0`
//    (rỗng/âm) và loại bỏ ví có số dư dương. Ý đồ đúng:
//    giữ `amount > 0` VÀ có priority hợp lệ.
//
// 3. BUG — interface `WalletBalance` không có field `blockchain`,
//    nhưng `getPriority(balance.blockchain)` lại đọc field này.
//    Mất type-safe — chỉ chạy được do tham số `getPriority` khai `any`.
//
// 4. BUG — comparator của sort thiếu `return 0` khi priority bằng nhau.
//    Trả về `undefined` → thứ tự sort không xác định, khác nhau giữa
//    các JS engine.
//
// 5. BUG — `rows` map qua `sortedBalances` (kiểu WalletBalance) nhưng
//    ép kiểu thành `FormattedWalletBalance` rồi đọc `.formatted`.
//    Field `formatted` không tồn tại → render ra "undefined".
//    Phải map qua `formattedBalances` mới đúng.
//
// 6. PERF — deps của `useMemo` có `prices`, nhưng body không hề dùng
//    `prices`. Mỗi lần giá cập nhật sẽ sort lại vô ích. Bỏ dep này.
//
// 7. PERF — `getPriority` được khai báo lại mỗi lần render. Đưa ra
//    ngoài component (hàm thuần, không phụ thuộc closure) hoặc bọc
//    `useCallback`. Đưa ra ngoài rẻ hơn.
//
// 8. PERF — `formattedBalances` tính lại mỗi render, chưa memo.
//    Bọc `useMemo` với key là `sortedBalances`.
//
// 9. PERF / ANTI-PATTERN — `key={index}`. Phá vỡ reconciliation khi
//    list bị sắp xếp lại (mà list này có sort!). Dùng key ổn định
//    như `currency` hoặc `blockchain-currency`.
//
// 10. ANTI-PATTERN — `blockchain: any` mất type safety. Dùng union
//     literal `Blockchain`.
//
// 11. ANTI-PATTERN — dùng switch cho map tĩnh. Thay bằng `Record`
//     lookup — O(1), khai báo gọn, dễ mở rộng.
//
// 12. ANTI-PATTERN — destructure `children` nhưng không render.
//     Hoặc render `{children}`, hoặc bỏ ra khỏi destructure.
//
// 13. ANTI-PATTERN — `Props` là interface rỗng extends `BoxProps`.
//     Dùng `type Props = BoxProps` (hoặc dùng thẳng `BoxProps`).
//
// 14. ANTI-PATTERN — chạy nhiều pass riêng (filter → sort → map format
//     → map rows). Gộp thành 1 pipeline trong cùng `useMemo`.
//
// 15. ANTI-PATTERN — `balance.amount.toFixed()` mặc định 0 chữ số thập
//     phân. Tiền tệ nên chỉ định precision (vd 2 hoặc 6) và format
//     theo locale.
//
// 16. MINOR — `usdValue` tính inline trong render; nên tính sẵn trong
//     cùng `useMemo` để JSX chỉ còn việc trình bày.
//
// =====================================================================
// BẢN REFACTOR
// =====================================================================

import React, { useMemo } from "react";

type Blockchain = "Osmosis" | "Ethereum" | "Arbitrum" | "Zilliqa" | "Neo";

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain;
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
  usdValue: number;
}

interface Props extends BoxProps {}

// Đặt ngoài component — hàm thuần, không cấp phát lại mỗi render. Fix #7, #11.
const PRIORITY: Record<Blockchain, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const getPriority = (blockchain: Blockchain): number =>
  PRIORITY[blockchain] ?? -99;

const WalletPage: React.FC<Props> = (props: Props) => {
  const { children, ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

  // Pipeline gộp: filter → sort → format → price. Fix #1,#2,#4,#5,#6,#8,#14.
  const rows = useMemo<FormattedWalletBalance[]>(() => {
    return balances
      .filter(
        (b: WalletBalance) => getPriority(b.blockchain) > -99 && b.amount > 0,
      )
      .sort(
        (a: WalletBalance, b: WalletBalance) =>
          getPriority(b.blockchain) - getPriority(a.blockchain),
      )
      .map(
        (b: WalletBalance): FormattedWalletBalance => ({
          ...b,
          formatted: b.amount.toFixed(2),
          usdValue: (prices[b.currency] ?? 0) * b.amount,
        }),
      );
  }, [balances, prices]);

  return (
    <div {...rest}>
      {rows.map((b) => (
        <WalletRow
          className={classes.row}
          key={`${b.blockchain}-${b.currency}`} // Key ổn định. Fix #9.
          amount={b.amount}
          usdValue={b.usdValue}
          formattedAmount={b.formatted}
        />
      ))}
      {children}
    </div>
  );
};

export default WalletPage;
