import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CustomizeAvatarComponent } from './customize-avatar.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CustomizeAvatarComponent', () => {
  let component: CustomizeAvatarComponent;
  let fixture: ComponentFixture<CustomizeAvatarComponent>;
  CommonTestingModule.setUpTestBed(CustomizeAvatarComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomizeAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
