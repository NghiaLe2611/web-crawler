import { format } from 'date-fns';

const currentData = format(new Date(), 'dd-MM-yyyy');

// export enum LotteryCrawlUrl {
// 	Mega645 = 'https://www.ketquadientoan.com/tat-ca-ky-xo-so-mega-6-45.html',
// 	Power655 = 'https://www.ketquadientoan.com/tat-ca-ky-xo-so-power-655.html',
// 	Max3D = '',
// }

export const LotteryCrawlUrl = {
	Mega645: 'https://www.ketquadientoan.com/tat-ca-ky-xo-so-mega-6-45.html',
	Mega645_Full: `https://www.ketquadientoan.com/tat-ca-ky-xo-so-mega-6-45.html?datef=20-07-2016&datet=${currentData}`,
	Power655: 'https://www.ketquadientoan.com/tat-ca-ky-xo-so-power-655.html',
	Power655_Full: `https://www.ketquadientoan.com/tat-ca-ky-xo-so-power-655.html?datef=20-07-2016&datet=${currentData}`,
	Max3D: '',
} as const;

export type LotteryType = 'Mega645' | 'Power655' | 'Max3D';
