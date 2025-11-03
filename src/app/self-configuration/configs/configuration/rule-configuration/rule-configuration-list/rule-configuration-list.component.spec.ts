import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RuleConfigurationListComponent } from './rule-configuration-list.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('RuleConfigurationListComponent', () => {
  let component: RuleConfigurationListComponent;
  let fixture: ComponentFixture<RuleConfigurationListComponent>;
  CommonTestingModule.setUpTestBed(RuleConfigurationListComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(RuleConfigurationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
