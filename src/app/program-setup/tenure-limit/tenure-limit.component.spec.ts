import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { TenureLimitComponent } from './tenure-limit.component';

describe('TenureLimitComponent', () => {
  let component: TenureLimitComponent;
  let fixture: ComponentFixture<TenureLimitComponent>;
  CommonTestingModule.setUpTestBed(TenureLimitComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TenureLimitComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TenureLimitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
