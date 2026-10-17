import { parse } from 'smol-toml';
import rawSiteCopy from '../config/site-copy.toml?raw';

interface NavItem {
  href: string;
  label: string;
}

interface HomeRoute {
  href: string;
  index: string;
  title: string;
  description: string;
  variant: 'frag' | 'novel';
}

interface HomeUtility {
  href: string;
  index: string;
  title: string;
  new_tab: boolean;
}

interface SiteCopy {
  site: {
    default_title: string;
    default_description: string;
    brand_title: string;
    brand_tagline: string;
    author_name: string;
    footer_note: string;
    contact_email: string;
    legacy_url: string;
    legacy_label: string;
    tweets_label: string;
    nav: NavItem[];
  };
  home: {
    page: {
      title: string;
      description: string;
    };
    masthead: {
      title: string;
    };
    hitokoto: {
      fallback_text: string;
      fallback_source: string;
    };
    routes: HomeRoute[];
    archive: {
      href: string;
      index: string;
      title: string;
    };
    utilities: HomeUtility[];
    latest_activity: {
      title: string;
      cta_label: string;
    };
  };
}

export const siteCopy = parse(rawSiteCopy) as unknown as SiteCopy;
