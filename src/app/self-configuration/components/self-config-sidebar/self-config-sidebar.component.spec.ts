import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelfConfigSidebarComponent } from './self-config-sidebar.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SelfConfigSidebarComponent', () => {
  let component: SelfConfigSidebarComponent;
  let fixture: ComponentFixture<SelfConfigSidebarComponent>;
  CommonTestingModule.setUpTestBed(SelfConfigSidebarComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SelfConfigSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
