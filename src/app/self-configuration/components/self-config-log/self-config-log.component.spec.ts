import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelfConfigLogComponent } from './self-config-log.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SelfConfigLogComponent', () => {
  let component: SelfConfigLogComponent;
  let fixture: ComponentFixture<SelfConfigLogComponent>;
  CommonTestingModule.setUpTestBed(SelfConfigLogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SelfConfigLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
