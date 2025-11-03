import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UnauthorizedAccessComponent } from './unauthorized-access.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('UnauthorizedAccessComponent', () => {
  let component: UnauthorizedAccessComponent;
  let fixture: ComponentFixture<UnauthorizedAccessComponent>;
  CommonTestingModule.setUpTestBed(UnauthorizedAccessComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(UnauthorizedAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
