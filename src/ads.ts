export interface AdService { initialize():Promise<void>; isRewardedAdReady():boolean; showRewardedAd():Promise<boolean>; isInterstitialAdReady():boolean; showInterstitialAd():Promise<boolean>; }
export class NoopAdService implements AdService {
 async initialize():Promise<void>{}
 isRewardedAdReady(){return false}
 async showRewardedAd(){return false}
 isInterstitialAdReady(){return false}
 async showInterstitialAd(){return false}
}
export const adService:AdService=new NoopAdService();
