import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ColorThemeComponent } from './color-theme.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ColorThemeComponent', () => {
  let component: ColorThemeComponent;
  let fixture: ComponentFixture<ColorThemeComponent>;
  CommonTestingModule.setUpTestBed(ColorThemeComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ColorThemeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
