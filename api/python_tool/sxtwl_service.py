#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import argparse, json, sys
from datetime import datetime
from zoneinfo import ZoneInfo
import sxtwl

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--y", type=int, required=True)
    p.add_argument("--m", type=int, required=True)
    p.add_argument("--d", type=int, required=True)
    # 시간/분은 선택 입력 (모를 경우 생략)
    p.add_argument("--hh", type=int, default=None)
    p.add_argument("--mm", type=int, default=None)
    # 타임존 추가 (예: "Asia/Seoul", "America/New_York", "UTC")
    p.add_argument("--tz", type=str, default="UTC", help="Timezone (e.g., Asia/Seoul, UTC)")
    # 경도 (태양시 계산용, 선택)
    p.add_argument("--lng", type=float, default=None, help="Longitude for solar time calculation")
    args = p.parse_args()

    # 타임존 정보 처리
    try:
        tz = ZoneInfo(args.tz)
    except Exception as e:
        sys.stderr.write(f"Invalid timezone: {args.tz}\n")
        sys.exit(1)

    # 입력된 날짜/시간을 해당 타임존으로 해석
    if args.hh is not None and args.mm is not None:
        dt = datetime(args.y, args.m, args.d, args.hh, args.mm, tzinfo=tz)
        # UTC로 변환 (필요시)
        dt_utc = dt.astimezone(ZoneInfo("UTC"))

        # 경도가 제공된 경우 태양시 보정 (15도당 1시간)
        actual_hour = args.hh
        actual_minute = args.mm
        if args.lng is not None:
            # 태양시 보정: 경도 차이를 시간으로 변환
            # 기준 경도(타임존 중심)에서 벗어난 정도를 분 단위로 보정
            # 예: 한국 표준시는 동경 135도 기준, 서울은 약 126.98도
            time_offset_minutes = (args.lng - (dt.utcoffset().total_seconds() / 3600 * 15)) * 4
            total_minutes = actual_hour * 60 + actual_minute + time_offset_minutes
            actual_hour = int(total_minutes // 60) % 24
            actual_minute = int(total_minutes % 60)
    else:
        dt = None
        dt_utc = None
        actual_hour = None
        actual_minute = None

    # sxtwl은 보통 (y,m,d) → day 객체를 만들고 간지/절기 등을 뽑음
    day = sxtwl.fromSolar(args.y, args.m, args.d)

    # 예시: 연/월/일 천간지지 뽑기 (함수명/필드는 sxtwl 버전에 따라 조금 다를 수 있음)
    yGZ = day.getYearGZ()
    mGZ = day.getMonthGZ()
    dGZ = day.getDayGZ()

    hour_hint = None
    if actual_hour is not None and actual_minute is not None:
        # 시지(時支) 계산: 시간대에 따라 고정
        # 23-01시: 子(0), 01-03시: 丑(1), 03-05시: 寅(2), ...
        hour_branch_index = ((actual_hour + 1) // 2) % 12

        # 시간(時干) 계산: 일간(日干)에 따라 결정
        # 공식: 시천간 = (일천간 × 2 + 시지지) % 10
        day_stem = dGZ.tg  # 일간(日干)
        hour_stem_index = (day_stem * 2 + hour_branch_index) % 10

        hour_hint = {
            "tg": hour_stem_index,  # 시천간
            "dz": hour_branch_index,  # 시지지
            "dz_index": hour_branch_index,  # 하위 호환성 유지
            "actual_hour": actual_hour,
            "actual_minute": actual_minute
        }

    out = {
        "input": {
            "y": args.y,
            "m": args.m,
            "d": args.d,
            "hh": args.hh,
            "mm": args.mm,
            "tz": args.tz,
            "lng": args.lng
        },
        "pillars": {
            "year": {"tg": yGZ.tg, "dz": yGZ.dz},
            "month": {"tg": mGZ.tg, "dz": mGZ.dz},
            "day": {"tg": dGZ.tg, "dz": dGZ.dz},
            # 시간/분이 생략되면 시 관련 값은 None으로 반환
            "hour_hint": hour_hint
        },
        "meta": {
            "isJieQi": bool(day.hasJieQi()),
            "jieQi": day.getJieQi() if day.hasJieQi() else None,
            "timezone_info": {
                "tz": args.tz,
                "utc_time": dt_utc.isoformat() if dt_utc else None,
                "local_time": dt.isoformat() if dt else None
            }
        }
    }

    sys.stdout.write(json.dumps(out, ensure_ascii=False))
    sys.stdout.flush()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        # stderr로만 에러 출력 (Go가 잡아내기 좋게)
        sys.stderr.write(str(e))
        sys.exit(1)
