import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { VMSHeaderComponent } from './header.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VMSHeaderComponent', () => {
  let component: VMSHeaderComponent;
  let fixture: ComponentFixture<VMSHeaderComponent>;
  CommonTestingModule.setUpTestBed(VMSHeaderComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(VMSHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
