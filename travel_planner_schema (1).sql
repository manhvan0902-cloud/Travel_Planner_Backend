-- =====================================================================
-- TRAVEL PLANNER APP - MYSQL DATABASE SCHEMA
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =====================================================================

CREATE DATABASE IF NOT EXISTS travel_planner
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE travel_planner;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- 1. USERS
-- =====================================================================
CREATE TABLE users (
  id            CHAR(36)      NOT NULL PRIMARY KEY,            -- UUID
  full_name     VARCHAR(150)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password      VARCHAR(255)  NOT NULL,                        -- bcrypt hash
  phone         VARCHAR(20)   NULL,
  avatar        VARCHAR(500)  NULL,
  bio           VARCHAR(150)  NULL,
  language      VARCHAR(10)   NOT NULL DEFAULT 'vi',
  dark_mode     TINYINT(1)    NOT NULL DEFAULT 0,
  total_trips   INT           NOT NULL DEFAULT 0,               -- cached count
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- =====================================================================
-- 2. TRIPS
-- =====================================================================
CREATE TABLE trips (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  title         VARCHAR(255)  NOT NULL,
  cover_image   VARCHAR(500)  NULL,
  start_date    DATE          NOT NULL,
  end_date      DATE          NOT NULL,
  status        ENUM('upcoming','ongoing','completed') NOT NULL DEFAULT 'upcoming',
  lead_id       CHAR(36)      NOT NULL,                         -- FK -> users (Lead)
  total_budget  DECIMAL(14,2) NULL,
  member_count  INT           NOT NULL DEFAULT 1,               -- số người DỰ KIẾN, Lead nhập tay
                                                                   -- (KHÔNG đồng bộ tự động từ trip_members;
                                                                  -- số người thực tế đang tham gia lấy bằng
                                                                  -- COUNT(trip_members) lúc query, không cache)
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_trips_lead FOREIGN KEY (lead_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_trips_lead (lead_id),
  INDEX idx_trips_status (status),
  INDEX idx_trips_dates (start_date, end_date)
) ENGINE=InnoDB;

-- =====================================================================
-- 3. TRIP MEMBERS (many-to-many User <-> Trip)
-- =====================================================================
CREATE TABLE trip_members (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  trip_id       CHAR(36)      NOT NULL,
  user_id       CHAR(36)      NOT NULL,
  role          ENUM('lead','member')              NOT NULL DEFAULT 'member',
  status        ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  joined_at     DATETIME      NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tm_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tm_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_trip_user (trip_id, user_id),
  INDEX idx_tm_user (user_id),
  INDEX idx_tm_status (status)
) ENGINE=InnoDB;

-- =====================================================================
-- 4. ITINERARY DAYS
-- =====================================================================
CREATE TABLE itinerary_days (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  trip_id       CHAR(36)      NOT NULL,
  day_number    INT           NOT NULL,                         -- Ngày 1, 2...
  date          DATE          NOT NULL,
  title         VARCHAR(255)  NULL,
  CONSTRAINT fk_day_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_trip_daynumber (trip_id, day_number),
  INDEX idx_day_trip (trip_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 5. ITINERARY ITEMS (chi tiết lịch trình theo danh mục)
-- =====================================================================
CREATE TABLE itinerary_items (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  day_id        CHAR(36)      NOT NULL,
  trip_id       CHAR(36)      NOT NULL,                         -- denormalized for fast queries
  category      ENUM('transport','accommodation','attraction','food') NOT NULL,
  title         VARCHAR(255)  NOT NULL,
  description   TEXT          NULL,
  location      VARCHAR(255)  NULL,                              -- tên địa điểm (lấy từ Maps API hoặc nhập tay)
  address       VARCHAR(500)  NULL,
  latitude      DECIMAL(10,7) NULL,
  longitude     DECIMAL(10,7) NULL,
  start_time    TIME          NULL,
  end_time      TIME          NULL,
  cost          DECIMAL(14,2) NULL,
  image_url     VARCHAR(500)  NULL,
  note          TEXT          NULL,
  created_by_id CHAR(36)      NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_item_day FOREIGN KEY (day_id) REFERENCES itinerary_days(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_item_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_item_creator FOREIGN KEY (created_by_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_item_day (day_id),
  INDEX idx_item_trip (trip_id),
  INDEX idx_item_category (category)
) ENGINE=InnoDB;

-- =====================================================================
-- 6. EXPENSES (khoản chi tiêu)
-- =====================================================================
CREATE TABLE expenses (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  trip_id       CHAR(36)      NOT NULL,
  day_id        CHAR(36)      NULL,                              -- gắn với ngày cụ thể nếu có
  title         VARCHAR(255)  NOT NULL,
  category      ENUM('transport','accommodation','food','entertainment','shopping','other') NOT NULL,
  amount        DECIMAL(14,2) NOT NULL,
  time_of_day   ENUM('morning','afternoon','evening') NOT NULL,
  note          VARCHAR(500)  NULL,
  paid_by_id    CHAR(36)      NOT NULL,                          -- FK -> users (ai trả)
  split_type    ENUM('equal','custom','none') NOT NULL DEFAULT 'equal',
  split_count   INT           NOT NULL DEFAULT 1,               -- mặc định = trips.member_count,
                                                                  -- user có thể sửa lại khi tạo expense
  amount_per    DECIMAL(14,2) NOT NULL,                          -- = amount / split_count (equal) hoặc cache
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_exp_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_exp_day FOREIGN KEY (day_id) REFERENCES itinerary_days(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_exp_paidby FOREIGN KEY (paid_by_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_exp_trip (trip_id),
  INDEX idx_exp_category (category),
  INDEX idx_exp_paidby (paid_by_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7b. EXPENSE SPLITS (chi tiết chia tiền khi split_type = 'custom')
--     Cho phép biết chính xác từng member nợ/được chia bao nhiêu.
-- ---------------------------------------------------------------------
CREATE TABLE expense_splits (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  expense_id    CHAR(36)      NOT NULL,
  user_id       CHAR(36)      NOT NULL,
  amount        DECIMAL(14,2) NOT NULL,                          -- số tiền user này phải chịu
  CONSTRAINT fk_split_expense FOREIGN KEY (expense_id) REFERENCES expenses(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_split_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_expense_user (expense_id, user_id),
  INDEX idx_split_user (user_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 7. TRIP FUND (quỹ chuyến đi) - 1:1 với Trip
-- =====================================================================
CREATE TABLE trip_funds (
  id                CHAR(36)      NOT NULL PRIMARY KEY,
  trip_id           CHAR(36)      NOT NULL UNIQUE,               -- 1 trip = 1 quỹ
  total_amount      DECIMAL(14,2) NOT NULL DEFAULT 0,
  collected_amount   DECIMAL(14,2) NOT NULL DEFAULT 0,            -- cached, đồng bộ từ contributions
  target_amount     DECIMAL(14,2) NOT NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_fund_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 8. CONTRIBUTIONS (log góp quỹ)
-- =====================================================================
CREATE TABLE contributions (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  fund_id       CHAR(36)      NOT NULL,
  user_id       CHAR(36)      NOT NULL,
  amount        DECIMAL(14,2) NOT NULL,                          -- số tiền góp lần này
  total         DECIMAL(14,2) NOT NULL,                          -- tổng đã góp của user này (cache)
  paid_at       DATETIME      NOT NULL,
  note          VARCHAR(500)  NULL,
  CONSTRAINT fk_contrib_fund FOREIGN KEY (fund_id) REFERENCES trip_funds(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_contrib_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_contrib_fund (fund_id),
  INDEX idx_contrib_user (user_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 9. CHECKLIST GROUPS
-- =====================================================================
CREATE TABLE checklist_groups (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  trip_id       CHAR(36)      NOT NULL,
  category      VARCHAR(255)  NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_group_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_group_trip (trip_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 10. CHECKLIST ITEMS
-- =====================================================================
CREATE TABLE checklist_items (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  trip_id       CHAR(36)      NOT NULL,
  group_id      CHAR(36)      NOT NULL,
  title         VARCHAR(255)  NOT NULL,
  is_completed  TINYINT(1)    NOT NULL DEFAULT 0,
  assigned_to   CHAR(36)      NULL,                              -- FK -> users; NULL => Lead chịu trách nhiệm
  due_date      DATE          NULL,
  created_by_id CHAR(36)      NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chk_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_chk_group FOREIGN KEY (group_id) REFERENCES checklist_groups(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_chk_assignee FOREIGN KEY (assigned_to) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_chk_creator FOREIGN KEY (created_by_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_chk_trip (trip_id),
  INDEX idx_chk_group (group_id),
  INDEX idx_chk_assignee (assigned_to)
) ENGINE=InnoDB;

-- =====================================================================
-- 10. MEMORIES (ảnh/video kỷ niệm - lưu trên Cloudinary)
-- =====================================================================
CREATE TABLE memories (
  id              CHAR(36)      NOT NULL PRIMARY KEY,
  trip_id         CHAR(36)      NOT NULL,
  uploaded_by_id  CHAR(36)      NOT NULL,
  media_url       VARCHAR(500)  NOT NULL,
  media_type      ENUM('image','video') NOT NULL,
  caption         VARCHAR(500)  NULL,
  taken_at        DATETIME      NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mem_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_mem_uploader FOREIGN KEY (uploaded_by_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_mem_trip (trip_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 11. NOTIFICATIONS
-- =====================================================================
CREATE TABLE notifications (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  user_id       CHAR(36)      NOT NULL,                          -- người nhận
  type          ENUM('trip_invite','expense_added','schedule_updated',
                      'checkout_reminder','member_joined') NOT NULL,
  title         VARCHAR(255)  NOT NULL,
  body          TEXT          NOT NULL,
  is_read       TINYINT(1)    NOT NULL DEFAULT 0,
  metadata      JSON          NULL,                              -- { tripId, senderId, senderName, senderAvatar, role, ... }
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_notif_user (user_id),
  INDEX idx_notif_user_read (user_id, is_read),
  INDEX idx_notif_type (type),
  INDEX idx_notif_created (created_at)
) ENGINE=InnoDB;

-- =====================================================================
-- 12. REFRESH TOKENS (hỗ trợ JWT refresh / logout / multi-device)
--     Không có trong tài liệu gốc nhưng cần thiết để triển khai
--     /api/auth/refresh-token và /api/auth/logout đúng cách.
-- =====================================================================
CREATE TABLE refresh_tokens (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  user_id       CHAR(36)      NOT NULL,
  token_hash    VARCHAR(255)  NOT NULL,
  expires_at    DATETIME      NOT NULL,
  revoked       TINYINT(1)    NOT NULL DEFAULT 0,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_rt_user (user_id),
  INDEX idx_rt_expires (expires_at)
) ENGINE=InnoDB;

-- =====================================================================
-- 13. OTP CODES (forgot-password / verify-otp / change-password flow)
-- =====================================================================
CREATE TABLE otp_codes (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  user_id       CHAR(36)      NOT NULL,
  code_hash     VARCHAR(255)  NOT NULL,                 -- hash OTP (sha256/bcrypt), KHÔNG lưu plain
  purpose       ENUM('forgot_password','verify_email','change_phone')
                              NOT NULL DEFAULT 'forgot_password',
  expires_at    DATETIME      NOT NULL,                  -- thường 5 phút
  attempts      INT           NOT NULL DEFAULT 0,        -- số lần nhập sai
  max_attempts  INT           NOT NULL DEFAULT 5,
  is_used       TINYINT(1)    NOT NULL DEFAULT 0,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_otp_user_purpose (user_id, purpose),
  INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- GHI CHÚ THIẾT KẾ
-- =====================================================================
-- 1. UUID lưu dạng CHAR(36) cho dễ đọc/migrate; nếu cần tối ưu performance
--    join/index, có thể đổi sang BINARY(16) + UUID_TO_BIN().
-- 2. Các cột "cached" (total_trips, collected_amount, amount_per,
--    total trong contributions) nên được đồng bộ qua service layer
--    (transaction) hoặc trigger, KHÔNG dùng làm nguồn sự thật duy
--    nhất — luôn có thể tính lại từ bảng con tương ứng. Riêng
--    trips.member_count KHÔNG phải cache — đây là input tay của Lead.
-- 3. expense_splits chỉ cần insert khi split_type = 'custom'; với
--    'equal' có thể tính amount_per runtime hoặc vẫn ghi đầy đủ để
--    truy vấn "by-member" nhanh hơn (GET /expenses/by-member).
-- 4. timeAgo và isToday (notification) là các trường TÍNH TOÁN ở
--    service/API layer, không lưu trong DB vì sẽ lệch theo thời gian.
-- 5. myRole (trong response Trip) suy ra từ trip_members theo user
--    đang đăng nhập, không lưu trực tiếp trong bảng trips.
-- 6. Cân nhắc thêm bảng "sessions"/Redis riêng cho cache notification
--    count và session, theo đề xuất công nghệ Redis trong tài liệu.
-- 7. otp_codes: nên có cron/job định kỳ xóa các bản ghi đã expires_at
--    quá lâu (ví dụ > 7 ngày) để bảng không phình to vô ích.
-- 8. trips.member_count là số DỰ KIẾN do Lead nhập tay, độc lập với
--    bảng trip_members. trip_members chỉ phản ánh AI ĐANG tham gia
--    (có thể nhiều/ít hơn member_count) — không tự đồng bộ 2 chiều.
-- 9. Đã bỏ bảng `places` riêng để đơn giản hóa: tìm địa điểm gọi trực
--    tiếp Maps API (Google/Goong/Mapbox...) để lấy gợi ý, KHÔNG lưu
--    DB ở bước search. Khi user chọn 1 kết quả, backend insert thẳng
--    name/address/lat/lng/image vào itinerary_items (cột location/
--    address/latitude/longitude/image_url) — không qua bảng trung
--    gian. Nếu sau này cần tái sử dụng địa điểm giữa nhiều trip hoặc
--    làm tính năng khám phá/gợi ý độc lập, có thể thêm lại bảng
--    `places` + cột place_id (FK) trong itinerary_items.


-- 1. SỬA bảng users: thêm cột fcm_token
USE `travel-planner`;

ALTER TABLE `users`
ADD COLUMN `fcm_token` VARCHAR(255) NULL;


ALTER TABLE notifications
MODIFY COLUMN type ENUM(
    'trip_invite',
    'expense_added',
    'schedule_updated',
    'checkout_reminder',
    'member_joined',
    'new_memory'
) NOT NULL;


ALTER TABLE trips 
ADD COLUMN trip_code VARCHAR(10) NOT NULL UNIQUE AFTER id;
