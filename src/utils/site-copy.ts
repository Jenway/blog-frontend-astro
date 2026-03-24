import { parse } from 'smol-toml';
import rawSiteCopy from '../config/site-copy.toml?raw';

interface NavItem {
  href: string;
  label: string;
}

interface HomeFact {
  label: string;
  value: string;
}

interface HomeRoute {
  href: string;
  index: string;
  title: string;
  description: string;
  arrow: string;
  variant: 'compact' | 'wide';
}

interface HomeUtility {
  href: string;
  index: string;
  title: string;
  description: string;
  arrow: string;
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
      kicker: string;
      title: string;
      subhead: string;
      deck: string;
      note: string;
    };
    hitokoto: {
      fallback_text: string;
      fallback_source: string;
    };
    facts: HomeFact[];
    routes: HomeRoute[];
    utilities: HomeUtility[];
    visual: {
      caption: string;
    };
    latest_activity: {
      eyebrow: string;
      title: string;
      cta_label: string;
    };
    current_focus: {
      eyebrow: string;
      title: string;
      items: string[];
    };
    about: {
      eyebrow: string;
      title: string;
      body: string;
      legacy_prefix: string;
      legacy_link_label: string;
      legacy_suffix: string;
    };
  };
}

export const siteCopy = parse(rawSiteCopy) as unknown as SiteCopy;
