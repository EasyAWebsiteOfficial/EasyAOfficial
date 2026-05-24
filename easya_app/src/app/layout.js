// -*- coding: utf-8 -*-
import './globals.css';

export const metadata = {
  title: 'Easy A | Đồng Hành Học Tập Đạt Điểm A Dễ Dàng',
  description: 'Easy A cung cấp dịch vụ hỗ trợ học thuật toàn diện cho sinh viên Việt Nam: Thu thập dữ liệu, chạy số liệu thống kê SPSS/Stata, viết tiểu luận, khóa luận, hạ đạo văn Turnitin và quét tỷ lệ AI chuyên nghiệp.',
  keywords: 'Easy A, viết tiểu luận, viết khóa luận, chạy SPSS, chạy Stata, hạ đạo văn, Turnitin, quét đạo văn AI, dịch vụ học tập, hỗ trợ nghiên cứu khoa học',
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎓</text></svg>" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
