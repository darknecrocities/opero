use rusqlite::{params, Connection};

use crate::error::OperoResult;
use crate::memory::dual_core::upsert_memory_chunk;

struct MmiKnowledgeSeed {
    source_id: &'static str,
    locale: &'static str,
    title: &'static str,
    content: &'static str,
}

const MMI_PUBLIC_KNOWLEDGE: &[MmiKnowledgeSeed] = &[
    MmiKnowledgeSeed {
        source_id: "mmi-corp-profile-en",
        locale: "en-US",
        title: "Man Machine Interface Inc. (MMI) — Corporate Profile",
        content: "MAN MACHINE INTERFACE, INC. (株式会社マン・マシンインターフェース, https://www.mmi-sc.co.jp/) was established on December 7, 1985 with capital of 10,000,000 JPY and 69 employees (as of May 2026). Its mission is bridging humans and machines through reliable software engineering. Member of Cyber Silk Road Hachioji, Hachioji IT Cooperative, and Tokyo Doyu-kai.",
    },
    MmiKnowledgeSeed {
        source_id: "mmi-corp-profile-ja",
        locale: "ja-JP",
        title: "株式会社マン・マシンインターフェース 会社概要",
        content: "社名：株式会社マン・マシンインターフェース（MAN MACHINE INTERFACE, INC.、https://www.mmi-sc.co.jp/）。設立：1985年（昭和60年）12月7日。資本金：1,000万円。従業員数：69名（2026年5月時点）。主な加盟団体：サイバーシルクロード八王子、八王子IT協同組合、東京同友会。",
    },
    MmiKnowledgeSeed {
        source_id: "mmi-directors-en",
        locale: "en-US",
        title: "Man Machine Interface Inc. — Representative Director & Leadership",
        content: "Current Representative Director (代表取締役) of Man Machine Interface, Inc. (mmi-sc.co.jp): Tetsuya Sekiguchi (関口 哲也). Managing Director (常務取締役): Hiroshi Yamanaka (山中 浩). Executive Officers (執行役員): Tatsuhiko Arai (新井 竜彦), Kunihiko Ishibashi (石橋 邦彦), Toshiya Satake (佐竹 俊哉), and Yoshiaki Sato (佐藤 由明).",
    },
    MmiKnowledgeSeed {
        source_id: "mmi-directors-ja",
        locale: "ja-JP",
        title: "株式会社マン・マシンインターフェース 代表取締役・役員構成",
        content: "株式会社マン・マシンインターフェース（mmi-sc.co.jp）の役員一覧：代表取締役 関口 哲也（Tetsuya Sekiguchi）、常務取締役 山中 浩（Hiroshi Yamanaka）、執行役員 新井 竜彦、執行役員 石橋 邦彦、執行役員 佐竹 俊哉、執行役員 佐藤 由明。",
    },
    MmiKnowledgeSeed {
        source_id: "mmi-directors-fil",
        locale: "fil-PH",
        title: "Man Machine Interface Inc. (MMI) — Pamunuan at Representative Director",
        content: "Ang kasalukuyang Representative Director ng Man Machine Interface, Inc. (https://www.mmi-sc.co.jp/) ay si Tetsuya Sekiguchi (関口 哲也). Managing Director si Hiroshi Yamanaka (山中 浩), kasama ang mga Executive Officer na sina Tatsuhiko Arai, Kunihiko Ishibashi, Toshiya Satake, at Yoshiaki Sato.",
    },
    MmiKnowledgeSeed {
        source_id: "mmi-offices-en",
        locale: "en-US",
        title: "Man Machine Interface Inc. — Head Office & Kojimachi Office",
        content: "Head Office / Software Center: Marutaya Building 3F, 6-9 Yokoyamacho, Hachioji-shi, Tokyo 192-0081, Japan. Kojimachi Office: Premium Office Kojimachi 3F, 2-10-2 Kojimachi, Chiyoda-ku, Tokyo 102-0083, Japan. Source: https://www.mmi-sc.co.jp/.",
    },
    MmiKnowledgeSeed {
        source_id: "mmi-offices-ja",
        locale: "ja-JP",
        title: "株式会社マン・マシンインターフェース 所在地（本社・麹町オフィス）",
        content: "本社／ソフトウェアセンター：〒192-0081 東京都八王子市横山町6番9号 丸多屋ビル3F。麹町オフィス：〒102-0083 東京都千代田区麹町2-10-2 プレミアムオフィス麹町3F。出典：https://www.mmi-sc.co.jp/。",
    },
    MmiKnowledgeSeed {
        source_id: "mmi-business-embedded-en",
        locale: "en-US",
        title: "MMI Business Domain — Embedded Software Development",
        content: "Man Machine Interface, Inc. specializes in Embedded Software Development (組込みソフトウェア開発), building reliable firmware and device software for digital consumer electronics, home appliances, precision medical equipment (including endoscopes), and automotive systems.",
    },
    MmiKnowledgeSeed {
        source_id: "mmi-business-si-en",
        locale: "en-US",
        title: "MMI Business Domain — SI Solutions, Cloud & Consulting",
        content: "Expanded since 2020, MMI's SI Solutions & Consulting division (SIソリューション事業) delivers IT consulting, financial systems (including ATMs), business applications (such as attendance management systems), cloud architecture (AWS Partner network), infrastructure engineering, and PMO support.",
    },
    MmiKnowledgeSeed {
        source_id: "mmi-business-ja",
        locale: "ja-JP",
        title: "株式会社マン・マシンインターフェース 事業内容",
        content: "主な事業内容はソフトウェア受託開発およびインフラ構築。1) 組込みソフトウェア開発事業（家電製品・スマートフォン・内視鏡など電子医療機器・車載システム）。2) SIソリューション事業（ITコンサルティング、金融系システム・ATM構築運用保守、勤怠管理等の業務アプリ、AWS等のクラウド・インフラ構築、PMO支援）。",
    },
];

pub fn seed_mmi_public_knowledge(conn: &Connection) -> OperoResult<usize> {
    let mut inserted = 0usize;
    for entry in MMI_PUBLIC_KNOWLEDGE {
        let exists: i64 = conn.query_row(
            "SELECT COUNT(*) FROM memory_chunks WHERE source_type = 'company_profile' AND source_id = ?1",
            params![entry.source_id],
            |r| r.get(0),
        )?;
        if exists == 0 {
            upsert_memory_chunk(
                conn,
                "semantic",
                None,
                "company_profile",
                entry.source_id,
                entry.locale,
                entry.title,
                entry.content,
                true,
            )?;
            inserted += 1;
        }
    }
    Ok(inserted)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::OperoStore;
    use crate::memory::dual_core::query_dual_core_memory;
    use tempfile::tempdir;

    #[test]
    fn test_mmi_public_knowledge_seeded_idempotently_and_retrievable_trilingually() {
        let dir = tempdir().unwrap();
        let store = OperoStore::open(dir.path()).unwrap();
        let conn = store.conn().unwrap();

        // Idempotent second call inserts 0 duplicates
        assert_eq!(seed_mmi_public_knowledge(&conn).unwrap(), 0);

        let en_hits = query_dual_core_memory(&conn, "Who is the Representative Director of Man Machine Interface?", Some("en-US"), 3).unwrap();
        assert!(!en_hits.is_empty());
        assert!(en_hits[0].chunk.content.contains("Tetsuya Sekiguchi"));

        let ja_hits = query_dual_core_memory(&conn, "株式会社マン・マシンインターフェース 代表取締役 関口", Some("ja-JP"), 3).unwrap();
        assert!(!ja_hits.is_empty());
        assert!(ja_hits[0].chunk.content.contains("関口 哲也"));

        let fil_hits = query_dual_core_memory(&conn, "Sino ang Representative Director ng Man Machine Interface?", Some("fil-PH"), 3).unwrap();
        assert!(!fil_hits.is_empty());
        assert!(fil_hits[0].chunk.content.contains("Tetsuya Sekiguchi"));

        let office_hits = query_dual_core_memory(&conn, "Hachioji headquarters Kojimachi office address", Some("en-US"), 3).unwrap();
        assert!(!office_hits.is_empty());
        assert!(office_hits[0].chunk.content.contains("Marutaya Building 3F"));
    }
}
