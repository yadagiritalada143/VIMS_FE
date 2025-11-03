import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SvmsSidebarLoaderComponent } from './svms-sidebar-loader.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SvmsSidebarLoaderComponent', () => {
  let component: SvmsSidebarLoaderComponent;
  let fixture: ComponentFixture<SvmsSidebarLoaderComponent>;
  CommonTestingModule.setUpTestBed(SvmsSidebarLoaderComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsSidebarLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
