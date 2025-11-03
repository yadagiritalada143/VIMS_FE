import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CustomHtmlComponent } from './custom-html.component';

describe('CustomHtmlComponent', () => {
  let component: CustomHtmlComponent;
  let fixture: ComponentFixture<CustomHtmlComponent>;
  CommonTestingModule.setUpTestBed(CustomHtmlComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomHtmlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomHtmlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
