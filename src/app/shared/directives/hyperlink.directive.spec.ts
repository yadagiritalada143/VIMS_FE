import { HyperlinkDirective } from './hyperlink.directive';
import { UrlService } from '../service/url.service';

describe('HyperlinkDirective', () => {
  it('should create an instance', () => {
    const urlServiceMock = {} as UrlService;
    const directive = new HyperlinkDirective(urlServiceMock);
    expect(directive).toBeTruthy();
  });
});
