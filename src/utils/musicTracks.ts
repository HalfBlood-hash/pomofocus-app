export interface Track {
  id: string;
  title: string;
  category: 'lofi' | 'classical' | 'synthwave' | 'ambient' | 'custom' | 'local';
  url: string;
  sourceType: 'stream' | 'file';
}

export const PRESET_TRACKS: Track[] = [
  {
    id: 'lofi-radio',
    title: '🎧 Lofi Chillhop Study Beats',
    category: 'lofi',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    sourceType: 'stream',
  },
  {
    id: 'lofi-cafe',
    title: '☕ Lofi Coffee House & Chill',
    category: 'lofi',
    url: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    sourceType: 'stream',
  },
  {
    id: 'classical-piano',
    title: '🎹 Calm Classical & Piano Focus',
    category: 'classical',
    url: 'https://stream.srg-ssr.ch/m/rsc_de/mp3_128',
    sourceType: 'stream',
  },
  {
    id: 'synth-retrowave',
    title: '⚡ Synthwave & Cyber Focus Beats',
    category: 'synthwave',
    url: 'https://stream.nightwaveplaza.net/plaza',
    sourceType: 'stream',
  },
  {
    id: 'nature-rain',
    title: '🌧️ Gentle Rain & Thunder Atmosphere',
    category: 'ambient',
    url: 'https://icecast.walmradio.com:8443/rain',
    sourceType: 'stream',
  },
];

