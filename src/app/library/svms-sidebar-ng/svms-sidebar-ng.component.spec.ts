import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SvmsSidebarNgComponent } from './svms-sidebar-ng.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SvmsSidebarComponent', () => {
  let component: SvmsSidebarNgComponent;
  let fixture: ComponentFixture<SvmsSidebarNgComponent>;
  CommonTestingModule.setUpTestBed(SvmsSidebarNgComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsSidebarNgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
